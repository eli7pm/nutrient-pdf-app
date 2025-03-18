# Nutrient PDF Converter

A Next.js application that uses the Nutrient (formerly PSPDFKit) Node.js SDK to convert various document formats to PDF.

## Features

- Upload documents (DOCX, DOC, PNG, JPG, etc.)
- Convert documents to PDF
- Download converted PDFs

## Prerequisites

- Node.js 18+ LTS or Node.js 20+
- npm or yarn

## Setup Instructions

1. Clone this repository:

```bash
git clone https://github.com/eli7pm/nutrient-pdf-app.git
cd nutrient-pdf-app
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Nutrient license information (if you have it):

```
NUTRIENT_LICENSE_KEY=YOUR_LICENSE_KEY
NUTRIENT_APP_NAME=YOUR_APP_NAME
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Create a new project on [Vercel](https://vercel.com).

3. Import your Git repository.

4. Add the following environment variables in your Vercel project settings:
   - `NUTRIENT_LICENSE_KEY`
   - `NUTRIENT_APP_NAME`

5. Deploy!

## Important Notes

- Without a license key, converted PDFs will contain a watermark.
- Contact Nutrient sales for a trial or full license key.
- The application uses temporary storage for file conversion.

## Resources

- [Nutrient SDK Documentation](https://pspdfkit.com/guides/web/current/nutrient-overview/nutrient/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)