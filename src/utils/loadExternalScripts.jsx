const loadExternalScripts = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = (e) =>
        reject(new Error(`❌ Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  });
  await Promise.all(promises);
};

export default loadExternalScripts;
