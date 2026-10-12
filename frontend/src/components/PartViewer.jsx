import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const MODEL_URL = `${process.env.PUBLIC_URL || ""}/assets/models/showcase-part.bin`;

// Binary layout written by the STEP export: uint32 nVerts, uint32 nTris,
// float32[nVerts*3] positions, uint16[nTris*3] indices (part centred, longest side = 2).
const parseMesh = (buffer) => {
  const header = new DataView(buffer, 0, 8);
  const nVerts = header.getUint32(0, true);
  const nTris = header.getUint32(4, true);
  const positions = new Float32Array(buffer, 8, nVerts * 3);
  const indices = new Uint16Array(buffer, 8 + nVerts * 12, nTris * 3);
  return { positions, indices };
};

const IDLE_RESUME_MS = 2500;
// The part always stays inside this fraction of the stage, from every viewing angle.
const FIT_MARGIN = 0.96;

const PartViewer = ({ onReady, onFail }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch (e) {
      onFail?.(e);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xaebbd0, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 2.5);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(2.1, 1.15, 2.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.1;
    controls.minPolarAngle = Math.PI * 0.36;
    controls.maxPolarAngle = Math.PI * 0.5;
    // OrbitControls claims every touch; give vertical swipes back to the page scroll.
    renderer.domElement.style.touchAction = "pan-y";

    let resumeTimer = null;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      clearTimeout(resumeTimer);
    });
    controls.addEventListener("end", () => {
      if (reducedMotion) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, IDLE_RESUME_MS);
    });

    let disposed = false;
    let visible = true;
    let rafId = null;
    let geometry = null;
    let material = null;
    let edgeMaterial = null;
    let edges = null;
    let fitCorners = null; // the part's bounding-box corners, in world space

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
    };

    const loop = () => {
      rafId = null;
      if (disposed || !visible || document.hidden) return;
      render();
      rafId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (rafId === null && !disposed) rafId = requestAnimationFrame(loop);
    };

    // Camera distance that keeps the whole part on screen from every angle the visitor can
    // reach (auto-rotation sweeps all azimuths; dragging changes the elevation within the
    // polar limits). Measured on the real bounding box rather than guessed, so it holds for
    // any stage shape: wide desktop, square, or a phone.
    const probe = new THREE.PerspectiveCamera(camera.fov, 1, 0.1, 50);
    const point = new THREE.Vector3();
    const worstExtent = (distance) => {
      probe.aspect = camera.aspect;
      probe.updateProjectionMatrix();
      const polars = [controls.minPolarAngle, (controls.minPolarAngle + controls.maxPolarAngle) / 2, controls.maxPolarAngle];
      let worst = 0;
      for (const polar of polars) {
        for (let step = 0; step < 24; step++) {
          const azimuth = (step / 24) * Math.PI * 2;
          probe.position.set(
            distance * Math.sin(polar) * Math.sin(azimuth),
            distance * Math.cos(polar),
            distance * Math.sin(polar) * Math.cos(azimuth)
          );
          probe.lookAt(0, 0, 0);
          probe.updateMatrixWorld();
          probe.matrixWorldInverse.copy(probe.matrixWorld).invert();
          for (const corner of fitCorners) {
            point.copy(corner).project(probe);
            worst = Math.max(worst, Math.abs(point.x), Math.abs(point.y));
          }
        }
      }
      return worst;
    };
    const fitDistance = () => {
      let near = 2;
      let far = 16;
      for (let i = 0; i < 14; i++) {
        const mid = (near + far) / 2;
        if (worstExtent(mid) > FIT_MARGIN) near = mid;
        else far = mid;
      }
      return far;
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (fitCorners) {
        camera.position.setLength(fitDistance());
        controls.update();
      }
      if (reducedMotion || !visible) render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    visibilityObserver.observe(mount);
    const onVisibilityChange = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (reducedMotion) controls.addEventListener("change", render);

    fetch(MODEL_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Model request failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (disposed) return;
        const { positions, indices } = parseMesh(buffer);
        const base = new THREE.BufferGeometry();
        base.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        base.setIndex(new THREE.BufferAttribute(indices, 1));
        // Crease angle keeps machined edges crisp while fillets and bores stay smooth.
        geometry = toCreasedNormals(base, THREE.MathUtils.degToRad(32));
        base.dispose();

        material = new THREE.MeshStandardMaterial({
          color: 0xd5dde9,
          metalness: 0.55,
          roughness: 0.42,
          envMapIntensity: 1.5,
        });
        const mesh = new THREE.Mesh(geometry, material);

        edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0a1a3a, transparent: true, opacity: 0.28 });
        edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 38), edgeMaterial);

        const group = new THREE.Group();
        group.add(mesh, edges);
        group.rotation.set(0, -0.5, 0);
        scene.add(group);

        geometry.computeBoundingBox();
        group.updateMatrixWorld(true);
        const { min, max } = geometry.boundingBox;
        fitCorners = [min.x, max.x].flatMap((x) =>
          [min.y, max.y].flatMap((y) => [min.z, max.z].map((z) => new THREE.Vector3(x, y, z).applyMatrix4(group.matrixWorld)))
        );

        controls.target.set(0, 0, 0);
        resize();
        render();
        onReady?.();
        start();
      })
      .catch((e) => {
        if (!disposed) onFail?.(e);
      });

    return () => {
      disposed = true;
      clearTimeout(resumeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      geometry?.dispose();
      edges?.geometry.dispose();
      material?.dispose();
      edgeMaterial?.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="part-viewer" aria-hidden="true" />;
};

export default PartViewer;
