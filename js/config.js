// ------------------------------------------------------------
// SITE CONFIGURATION
// The site works without any of this (it reads the /data/*.json files).
// Fill these in later to switch on the dashboard, database and image uploads.
// ------------------------------------------------------------

// Firebase console > Project settings > General > Your apps > Web app > Config
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Cloudinary > Settings > Upload > Upload presets > Add preset (Signing mode: Unsigned)
export const cloudinary = {
  cloudName: "",
  uploadPreset: ""
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const cloudinaryEnabled = Boolean(cloudinary.cloudName && cloudinary.uploadPreset);
