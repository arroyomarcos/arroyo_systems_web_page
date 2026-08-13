import { useLocation } from "react-router-dom";
import { content } from "./content";

export const LANGS = ["en", "es"];
export const LANG_PREF_KEY = "arroyo_lang";

export const getLangFromPath = (pathname) =>
  pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";

export const useLang = () => getLangFromPath(useLocation().pathname);

export const useContent = () => content[useLang()];

// Strips a leading "/es" prefix, always returning a path starting with "/".
export const stripLangPrefix = (pathname) => {
  if (pathname === "/es") return "/";
  if (pathname.startsWith("/es/")) return pathname.slice(3);
  return pathname;
};

// Builds the path for `path` (an EN-rooted path starting with "/", may include a #hash) in `lang`.
export const withLang = (lang, path) => (lang === "es" ? (path === "/" ? "/es" : `/es${path}`) : path);
