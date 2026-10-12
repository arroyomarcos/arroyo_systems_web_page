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
    renderer.toneMappingExposure = 1.05;
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
    camera.position.set(2.45, 1.5, 2.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.1;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.62;
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

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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

        controls.target.set(0, 0, 0);
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
