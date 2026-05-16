# Brain Dash Quiz — Deploy & Local Test

## Local (XAMPP)

1. Place project in `c:\xampp\htdocs\WebSimpleGame`
2. Start Apache in XAMPP
3. Open `http://localhost/WebSimpleGame/`

> Requires internet for Open Trivia DB API. Disconnect to test offline fallback.

## Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From project folder: `vercel`
3. Publish directory: `.` (root with `index.html`)

Or connect the GitHub repo in the Vercel dashboard with no build command.

## Netlify

1. Drag-and-drop the project folder at [app.netlify.com/drop](https://app.netlify.com/drop)
2. Or connect repo; publish directory = `.`; build command = empty

## Notes

- Static site only; API calls run in the browser (OpenTDB).
- Best score stored in `localStorage` on each device.
