// Version only explicit public assets. Page navigation, API routes and external URLs
// keep their original values. One deterministic release ID also covers CSS images.
export function versionAssets(source, file, publicFiles, version) {
  const allowed = new Set(publicFiles);
  const base = new URL(file, "https://release.invalid/");
  const assetURL = value => {
    let url;
    try { url = new URL(value, base); } catch { return value; }
    if (url.origin !== base.origin || !allowed.has(url.pathname.slice(1)) ||
        !/\.(?:css|js|svg|png|webp|jpe?g|ico|woff2?)$/i.test(url.pathname)) return value;
    const hash = value.indexOf("#");
    const path = hash < 0 ? value : value.slice(0, hash);
    const fragment = hash < 0 ? "" : value.slice(hash);
    return path + (path.includes("?") ? "&" : "?") + "v=" + version + fragment;
  };
  if (file.endsWith(".html")) return source.replace(
    /\b(src|href)=(['"])([^'"<>]+)\2/g,
    (_, name, quote, value) => `${name}=${quote}${assetURL(value)}${quote}`,
  );
  if (file.endsWith(".css")) return source.replace(
    /url\(\s*(['"]?)([^\s'"()]+)\1\s*\)/g,
    (_, quote, value) => `url(${quote}${assetURL(value)}${quote})`,
  );
  return source;
}
