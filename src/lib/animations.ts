import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Text fill animation on scroll
export const animateTextFill = (element: HTMLElement) => {
  const text = element.textContent || "";
  element.innerHTML = `
    <span class="text-fill-wrapper" style="position: relative; display: inline-block;">
      <span class="text-fill-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; color: transparent; -webkit-text-stroke: 1px currentColor;">${text}</span>
      <span class="text-fill-fg" style="position: relative; display: inline-block; background: linear-gradient(to right, currentColor 0%, currentColor 50%, transparent 50%); background-size: 200% 100%; background-position: 100% 0; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${text}</span>
    </span>
  `;

  const fillElement = element.querySelector(".text-fill-fg") as HTMLElement;

  gsap.to(fillElement, {
    backgroundPosition: "0% 0",
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      end: "top 20%",
      scrub: 1,
    },
  });
};

// Parallax effect for elements
export const parallaxEffect = (element: HTMLElement, speed: number = 0.5) => {
  gsap.to(element, {
    y: () => window.innerHeight * speed,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
};

// Fade and slide up animation
export const fadeSlideUp = (element: HTMLElement, delay: number = 0) => {
  gsap.from(element, {
    y: 60,
    opacity: 0,
    duration: 1,
    delay,
    ease: "power3.out",
    scrollTrigger: {
      trigger: element,
      start: "top 85%",
      toggleActions: "play none none none",
    },
  });
};

// Scale on scroll
export const scaleOnScroll = (element: HTMLElement) => {
  gsap.from(element, {
    scale: 0.8,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });
};

// Image parallax with ken burns effect
export const imageParallax = (element: HTMLElement, speed: number = 0.3) => {
  gsap.to(element, {
    y: () => window.innerHeight * speed,
    scale: 1.2,
    ease: "none",
    scrollTrigger: {
      trigger: element.parentElement,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
};

// Stagger animation for lists
export const staggerFadeIn = (elements: HTMLElement[], delay: number = 0.1) => {
  gsap.from(elements, {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: delay,
    ease: "power3.out",
    scrollTrigger: {
      trigger: elements[0],
      start: "top 85%",
      toggleActions: "play none none none",
    },
  });
};

// Reveal animation with clip path
export const revealClipPath = (element: HTMLElement) => {
  gsap.from(element, {
    clipPath: "inset(0 100% 0 0)",
    duration: 1.5,
    ease: "power4.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });
};

// Counter animation
export const animateCounter = (element: HTMLElement, target: number, duration: number = 2) => {
  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration,
    ease: "power2.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      toggleActions: "play none none none",
    },
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toString();
    },
  });
};

// Smooth scroll to section
export const scrollToSection = (target: string) => {
  gsap.to(window, {
    duration: 1.5,
    scrollTo: { y: target, offsetY: 100 },
    ease: "power3.inOut",
  });
};
