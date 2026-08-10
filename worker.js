// Passthrough Worker: serve the built static site from the ASSETS binding, with
// single-page-application fallback (index.html for unknown routes). This replaces
// the default "Hello world" Worker so the deployed site actually renders.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
