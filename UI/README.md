# Onion Quality Assessment Portal

A responsive React, Vite and Tailwind CSS v4 prototype for **AI-Based Onion Quality Assessment & Grading System**.

## Features

- Simple government-style masthead and navigation, with a six-second photographic carousel.
- Home, Dashboard, AI Assessment, Batches, Reports, History, Standards and Help pages.
- Desktop camera access, mobile camera capture, drag-and-drop uploads and a sample image.
- Five-stage simulated assessment with clearly labeled illustrative grades and bounding boxes.
- Locally saved assessments and images, searchable and filterable batch history, and CSV export.
- Downloadable PDF reports and a dedicated print stylesheet.
- Keyboard-accessible controls, font-size settings, reduced motion and Hindi navigation/core labels.
- Project, contact, accessibility, privacy and locally saved feedback pages.

## Implementation

- `src/App.tsx`: application entry, hash-based routing, preferences and shared state.
- `src/pages/`: portal pages and assessment workflow.
- `src/components/`: shared header, footer, tables, result views and report controls.
- `src/lib/data.ts`: typed demo data, image sources and local persistence helpers.
- `src/lib/report.ts`: PDF generation.
- `src/index.css`: responsive design, minimal motion and print rules.

## Demo Limitations

This is not an official Government of India website. No AI endpoint or backend is connected. Assessment percentages, object counts and bounding boxes are simulated, not derived from the uploaded image. The Standards page does not invent official thresholds or a definition of URS.

Completed assessments and feedback are stored in the current browser only. Images are resized locally and are not uploaded. If browser storage is full or unavailable, the interface explains that the new assessment is available only for the current session.

Camera access requires HTTPS or localhost and browser permission. The feedback form does not send messages. Technical guidance and PDF reports are in English; Hindi covers navigation, home content and primary workflow labels.

## Image Sources

Source details and attribution are included on the About Project page. The State Emblem artwork is sourced from Wikimedia Commons; separate non-copyright restrictions may govern official emblem use. The Prime Minister photograph is a genuine Prime Minister's Office photograph at IARI on 11 October 2017, licensed under GODL-India. It appears only in the carousel. Farm, market and sample images are licensed Pexels photographs. No fictional image of the Prime Minister has been generated or composited.

Authorization for official branding, approved procurement standards, validated AI inference, secure storage and an accessibility audit are required before an operational deployment.