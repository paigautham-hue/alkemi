/**
 * Guided Tour Configuration
 * 
 * Interactive walkthrough for new users using Shepherd.js
 */

import Shepherd from "shepherd.js";
import type { Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export function createTour(): Tour {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true,
      },
      classes: "shepherd-theme-custom",
      scrollTo: { behavior: "smooth", block: "center" },
    },
  });

  // Step 1: Welcome
  tour.addStep({
    id: "welcome",
    title: "Welcome to ALKEMI™",
    text: "Let's take a quick tour of the platform's key features. This will only take a minute!",
    buttons: [
      {
        text: "Skip Tour",
        action: tour.cancel,
        secondary: true,
      },
      {
        text: "Start Tour",
        action: tour.next,
      },
    ],
  });

  // Step 2: Load Demo Data
  tour.addStep({
    id: "demo-data",
    title: "Load Demo Data",
    text: "Click this button to populate the platform with sample materials, formulations, predictions, and trials. This helps you explore all features immediately.",
    attachTo: {
      element: "[data-tour='load-demo-data']",
      on: "bottom",
    },
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 3: Navigation
  tour.addStep({
    id: "navigation",
    title: "Navigation Menu",
    text: "Access all platform features from this sidebar. Key sections include Materials, Formulations, Predictions, Trials, and Compliance.",
    attachTo: {
      element: "[data-tour='navigation']",
      on: "right",
    },
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 4: Materials
  tour.addStep({
    id: "materials",
    title: "Materials Library",
    text: "Build your materials database with properties like viscosity, density, and Hansen solubility parameters. These feed into physics-based predictions.",
    attachTo: {
      element: "[data-tour='materials-card']",
      on: "bottom",
    },
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 5: Formulations
  tour.addStep({
    id: "formulations",
    title: "Formulation Management",
    text: "Create formulations with version control and branching. Manage composition, run predictions, and track experimental validation.",
    attachTo: {
      element: "[data-tour='formulations-card']",
      on: "bottom",
    },
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 6: Quick Actions
  tour.addStep({
    id: "quick-actions",
    title: "Quick Actions",
    text: "Common workflows are just a click away. Add materials, create formulations, or add suppliers from this panel.",
    attachTo: {
      element: "[data-tour='quick-actions']",
      on: "top",
    },
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 7: Predictions
  tour.addStep({
    id: "predictions",
    title: "AI-Powered Predictions",
    text: "Get property predictions using both LLM reasoning and physics models (Hansen Solubility, viscosity, Tg). Compare predictions against actual trial results.",
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 8: Trials
  tour.addStep({
    id: "trials",
    title: "Experimental Validation",
    text: "Record trial results and compare measured values against predictions. Track accuracy over time to improve your models.",
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 9: Compliance
  tour.addStep({
    id: "compliance",
    title: "Regulatory Compliance",
    text: "Activate pre-configured compliance templates (FDA, EU Cosmetics, REACH) to automatically check formulations against regulatory rules.",
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 10: Documents & RAG
  tour.addStep({
    id: "documents",
    title: "Document Intelligence",
    text: "Upload technical documents and ask questions. The RAG system extracts relevant information and provides AI-powered answers with citations.",
    buttons: [
      {
        text: "Back",
        action: tour.back,
        secondary: true,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Step 11: Complete
  tour.addStep({
    id: "complete",
    title: "You're All Set!",
    text: "You're ready to start using ALKEMI™. Load the demo data to explore features, or start building your own materials library. Need help? Check the documentation or contact support.",
    buttons: [
      {
        text: "Finish Tour",
        action: tour.complete,
      },
    ],
  });

  return tour;
}

// Tour completion tracking
const TOUR_COMPLETED_KEY = "alkemi-tour-completed";

export function hasTourBeenCompleted(): boolean {
  return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
}

export function markTourAsCompleted(): void {
  localStorage.setItem(TOUR_COMPLETED_KEY, "true");
}

export function resetTour(): void {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}
