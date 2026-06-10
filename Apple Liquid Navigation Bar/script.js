document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");
    const activePill = document.getElementById("active-pill");
    const themeBtn = document.getElementById("theme-btn");
    const nav = document.getElementById("nav");
    const glare = document.getElementById("glare");

    function updatePill(btn, smooth = true) {
        if (!btn) return;

        activePill.style.transition = smooth
            ? "transform .5s cubic-bezier(.34,1.2,.64,1), width .5s cubic-bezier(.34,1.2,.64,1)"
            : "none";

        activePill.style.width = `${btn.offsetWidth}px`;
        activePill.style.transform = `translateX(${btn.offsetLeft}px)`;
    }

    const initialActive = document.querySelector(".nav-btn.active");

    if (initialActive) {
        setTimeout(() => {
            updatePill(initialActive, false);
            void activePill.offsetWidth;
        }, 50);
    }

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updatePill(btn);
        });
    });

    themeBtn.addEventListener("click", () => {
        const root = document.documentElement;
        const isDark = root.getAttribute("data-theme") === "dark";

        root.setAttribute(
            "data-theme",
            isDark ? "light" : "dark"
        );

        setTimeout(() => {
            const active = document.querySelector(".nav-btn.active");
            if (active) updatePill(active);
        }, 100);
    });

    window.addEventListener("resize", () => {
        const active = document.querySelector(".nav-btn.active");
        if (active) updatePill(active, false);
    });

    nav.addEventListener("mousemove", e => {
        const rect = nav.getBoundingClientRect();

        glare.style.setProperty("--x", `${e.clientX - rect.left}px`);
        glare.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
});