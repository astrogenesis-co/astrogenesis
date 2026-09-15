(() => {
  const facade = document.querySelector(".facade");
  const frame = document.querySelector("#orbit-world");
  const link = document.querySelector(".star-link");
  const back = document.querySelector("#return-surface");
  const status = document.querySelector(".entrance-status");
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  const orbit = new URL(
    local ? `http://${location.hostname}:4321/orbit/` : link.href,
  );
  orbit.searchParams.set("entrance", "1");
  if (location.hash === "#beyond")
    history.replaceState(null, "", location.pathname + location.search);
  let ready = false,
    pending = false,
    timer,
    finishTimer;
  function send(type) {
    frame.contentWindow.postMessage({ type }, orbit.origin);
  }
  function preload() {
    if (!frame.getAttribute("src")) frame.src = orbit.href;
  }
  function reveal(addHistory = true) {
    pending = false;
    clearTimeout(timer);
    status.textContent = "";
    if (addHistory)
      history.pushState({ astrogenesisOrbit: true }, "", "#beyond");
    facade.inert = true;
    document.body.classList.add("revealing");
    finishTimer = setTimeout(
      () => {
        document.body.classList.replace("revealing", "in-orbit");
        frame.inert = false;
        frame.removeAttribute("tabindex");
        back.hidden = false;
        frame.focus();
        send("astrogenesis:reveal");
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2400,
    );
  }
  function restore() {
    clearTimeout(finishTimer);
    send("astrogenesis:conceal");
    document.body.classList.remove("revealing", "in-orbit");
    facade.inert = false;
    frame.inert = true;
    frame.tabIndex = -1;
    back.hidden = true;
    link.focus({ preventScroll: true });
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== orbit.origin || event.source !== frame.contentWindow)
      return;
    if (event.data?.type === "astrogenesis:surface") {
      if (document.body.classList.contains("in-orbit")) history.back();
      return;
    }
    if (event.data?.type !== "astrogenesis:ready") return;
    ready = true;
    if (pending) reveal();
  });
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (
      pending ||
      document.body.classList.contains("revealing") ||
      document.body.classList.contains("in-orbit")
    )
      return;
    preload();
    if (ready) return reveal();
    pending = true;
    status.textContent = "The surface is thinning…";
    timer = setTimeout(() => {
      pending = false;
      status.textContent =
        "Space is taking longer to respond. Try again, or open First Star directly.";
      const fallback = document.createElement("a");
      fallback.href = new URL("/orbit/", orbit).href;
      fallback.textContent = " Open First Star";
      status.append(fallback);
    }, 12000);
  });
  back.addEventListener("click", () => history.back());
  window.addEventListener("popstate", () => {
    if (
      document.body.classList.contains("revealing") ||
      document.body.classList.contains("in-orbit")
    )
      restore();
    else if (history.state?.astrogenesisOrbit && ready) {
      // Forward should replay the reveal without adding another history entry.
      reveal(false);
    }
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preload();
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(document.querySelector(".first-star"));
  }
})();
