Why you see `error` for models

The diagnostics show all models as `error` because the face-api model files are not present at `/models/*` on the dev server. face-api tries to fetch those files from `/models` (served from `public/models` in a Vite app). If the files are missing, the browser gets 404s and the model load fails.

How to fix (quick)

1. Place the required model files in the folder `public/models` at the project root. Example path:

   `async_music/public/models/<model-files>`

2. Start or reload the dev server and open the app. The diagnostics should show `loaded` for each model.

Model filenames (download from the face-api weights repo)

The typical files required are (each has a manifest JSON and one or more binary shards):

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

Note: the shard files often have a `.bin` extension in the GitHub repo; keep whatever names you download so the manifest JSON references match the shard filenames.

Download sources

Official weights (raw files):
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

If you prefer the maintained fork, the same weights work; many projects host the same model files.

Automatic download (PowerShell)

If you are on Windows, run the helper script at `scripts/download-faceapi-models.ps1` from the project root. It will create `public/models` and download the files from the face-api GitHub raw URLs.

After downloading

- Restart the dev server and open the app (e.g. http://localhost:5174).
- Click `Start Webcam` and allow camera permission.
- Diagnostics should show `loaded` for models and `Webcam active: Yes`.

If something still fails, open DevTools → Network and filter `/models/` requests to see 404 or other errors, and paste them here.
