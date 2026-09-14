import { channelGain } from "./stem-state.mjs";

class StemPlayer extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    const $ = (selector) => this.querySelector(selector);
    const play = $("[data-play]");
    const seek = $("[data-seek]");
    const status = $("[data-status]");
    const master = $("[data-master]");
    const channels = [...this.querySelectorAll("[data-url]")].map((row) => ({
      row,
      volume: 1,
      mute: false,
      solo: false,
    }));
    let context,
      output,
      buffers,
      sources = [],
      gains = [];
    let playing = false,
      loading = false,
      offset = 0,
      started = 0,
      duration = 0,
      frame;
    const format = (n) =>
      `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
    const position = () =>
      playing
        ? Math.min(
            duration,
            offset + Math.max(0, context.currentTime - started),
          )
        : offset;
    const updateGains = () =>
      gains.forEach((gain, i) =>
        gain.gain.setTargetAtTime(
          channelGain(channels, i),
          context.currentTime,
          0.015,
        ),
      );
    const renderTime = () => {
      seek.value = String(position());
      $("[data-time]").textContent =
        `${format(position())} / ${format(duration)}`;
    };
    const stop = () => {
      offset = position();
      playing = false;
      sources.forEach((s) => {
        s.stop();
        s.disconnect();
      });
      gains.forEach((g) => g.disconnect());
      sources = [];
      gains = [];
      cancelAnimationFrame(frame);
      play.textContent = "Play stems";
      renderTime();
    };
    const tick = () => {
      renderTime();
      if (position() >= duration) {
        stop();
        offset = 0;
        renderTime();
      } else frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (offset >= duration) offset = 0;
      document.dispatchEvent(new CustomEvent("stem-play", { detail: this }));
      document.querySelectorAll("audio").forEach((audio) => audio.pause());
      // All channels are scheduled against one audio clock, including after seeks.
      started = context.currentTime + 0.05;
      sources = buffers.map((buffer, i) => {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = channelGain(channels, i);
        source.connect(gain).connect(output);
        gains.push(gain);
        source.start(started, offset);
        return source;
      });
      playing = true;
      play.textContent = "Pause stems";
      status.textContent = "All channels share one playback position.";
      tick();
    };
    play.addEventListener("click", async () => {
      if (loading) return;
      if (playing) {
        stop();
        return;
      }
      loading = true;
      play.disabled = true;
      try {
        if (!context) {
          context = new AudioContext();
          output = context.createGain();
          output.gain.value = Number(master.value) / 100;
          // A safety compressor catches peaks when several channels sum together.
          output
            .connect(context.createDynamicsCompressor())
            .connect(context.destination);
        }
        await context.resume();
        if (!buffers) {
          status.textContent = "Loading stem audio…";
          const loaded = [];
          // Decode sequentially to limit temporary memory on mobile devices.
          for (const channel of channels) {
            const response = await fetch(channel.row.dataset.url, {
              signal: this.abort.signal,
            });
            if (!response.ok) throw new Error("Audio unavailable");
            loaded.push(
              await context.decodeAudioData(await response.arrayBuffer()),
            );
            status.textContent = `Loading stems: ${loaded.length} of ${channels.length}…`;
          }
          if (
            Math.max(...loaded.map((b) => b.duration)) -
              Math.min(...loaded.map((b) => b.duration)) >
            0.1
          )
            throw new Error("Stem lengths do not match");
          buffers = loaded;
          duration = Math.min(...buffers.map((b) => b.duration));
          seek.max = String(duration);
          seek.disabled = false;
        }
        if (this.isConnected) start();
      } catch (error) {
        status.textContent =
          "Could not load the stem set. Press play to retry.";
      } finally {
        loading = false;
        play.disabled = false;
      }
    });
    seek.addEventListener("input", () => {
      const next = Number(seek.value),
        resume = playing;
      stop();
      offset = next;
      if (resume) start();
      else renderTime();
    });
    channels.forEach((channel) => {
      channel.row
        .querySelector("[data-volume]")
        .addEventListener("input", (event) => {
          channel.volume = Number(event.target.value) / 100;
          channel.row.querySelector("output").textContent =
            `${event.target.value}%`;
          updateGains();
        });
      for (const kind of ["mute", "solo"]) {
        const button = channel.row.querySelector(`[data-${kind}]`);
        button.addEventListener("click", () => {
          channel[kind] = !channel[kind];
          button.setAttribute("aria-pressed", String(channel[kind]));
          updateGains();
        });
      }
    });
    master.addEventListener("input", () => {
      master.nextElementSibling.textContent = `${master.value}%`;
      output?.gain.setTargetAtTime(
        Number(master.value) / 100,
        context.currentTime,
        0.015,
      );
    });
    $("[data-reset]").addEventListener("click", () => {
      channels.forEach((channel) => {
        channel.volume = 1;
        channel.mute = false;
        channel.solo = false;
        channel.row.querySelector("input").value = "100";
        channel.row.querySelector("output").textContent = "100%";
        channel.row
          .querySelectorAll("button")
          .forEach((b) => b.setAttribute("aria-pressed", "false"));
      });
      master.value = "70";
      master.dispatchEvent(new Event("input"));
      updateGains();
    });
    this.abort = new AbortController();
    document.addEventListener(
      "stem-play",
      (event) => {
        if (event.detail !== this && playing) stop();
      },
      { signal: this.abort.signal },
    );
    document.addEventListener(
      "play",
      (event) => {
        if (event.target instanceof HTMLAudioElement && playing) stop();
      },
      { capture: true, signal: this.abort.signal },
    );
    this.cleanup = () => {
      stop();
      this.abort.abort();
      context?.close();
    };
  }
  disconnectedCallback() {
    this.cleanup?.();
  }
}
customElements.define("stem-player", StemPlayer);
