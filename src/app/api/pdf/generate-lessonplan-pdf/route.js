import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from "@/lib/auth";

async function getBrowserExecutablePath() {
  if (process.env.AWS_REGION || process.env.VERCEL) {
    return chromium.executablePath();
  }

  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    ...(process.platform === 'win32'
      ? [
          path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next known browser location.
    }
  }

  throw new Error(
    'No local Chrome or Chromium browser was found. Install Chrome or set PUPPETEER_EXECUTABLE_PATH to its executable.'
  );
}

export async function POST(req) {
  try {
    await requireAuth();
    const { lessonPlan } = await req.json();
    if (!lessonPlan || typeof lessonPlan !== 'object' || typeof lessonPlan.lessonTitle !== 'string') {
      return NextResponse.json({ error: 'A valid lesson plan is required.' }, { status: 400 });
    }

    const imagePath = path.join(process.cwd(), 'public', 'LessonCraftLogo.png');
    const imageBuffer = await fs.readFile(imagePath);
    const logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const browser = await puppeteer.launch({
      args: process.env.AWS_REGION || process.env.VERCEL ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath: await getBrowserExecutablePath(),
      headless: true,
    });
    try {
    const page = await browser.newPage();

    // --- Icons and colors matching the frontend ---
    const icons = {
      objectives: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
      prerequisites: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      materials: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
      strategies: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3Z"/><path d="M7 21v-4"/><path d="M17 21v-4"/><path d="M12 15l-3-3h6l-3 3"/></svg>`,
      outline: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>`,
      lecture: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>`,
      activities: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 8.7-8.7a3.5 3.5 0 0 0-4.9-5l-4.8 4.8A3.5 3.5 0 0 0 3 21"/><path d="M12 12a3.5 3.5 0 0 0 5 0l4.9-4.9a3.5 3.5 0 0 0-5-5L12 12Z"/></svg>`,
      assessment: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 12h2"/><path d="M7 12h2"/><path d="M20 12h2"/><path d="m18 6-8.5 8.5"/><path d="M16 4l2 2"/></svg>`,
      homework: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
      recap: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
      // NEW: Icon for the References section
      references: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>` // ListChecks, text-indigo-500
    };
    
    // --- NEW: A helper object for reference item icons ---
    const referenceIcons = {
        activity: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8.5"/></svg>`,
        quiz: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="M17.8 17.8 16 16"/><path d="M16 16s-2 2-4 4-4 4-4 4"/><path d="m22 22-5-5"/><path d="M8 22s-2-2-4-4-4-4-4-4"/></svg>`,
        exam: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
        doubt: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 12h2"/><path d="M16 12h2"/></svg>`,
        notes: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>`,
    };

    // Helper to format lists
    const list = (items) =>
      items?.length
        ? `<ul class="list-disc pl-5 space-y-1">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
        : `<p>None</p>`;
    
    // HTML content
    const fullHtml = `
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f8fafc; color: #374151; }
    .section { margin-bottom: 24px; }
    .section-title { font-weight: bold; font-size: 1.25rem; color: #1f2937; display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .list-disc { padding-left: 2rem; }
    .text-pink-400 { color: #f472b6; }
    .text-purple-800 { color: #6b21a8; }
    .text-blue-800 { color: #1e40af; }
    .text-red-800 { color: #991b1b; }
    .ref-link { color: #2563eb; text-decoration: underline; }
    .ref-item { display: flex; align-items: center; gap: 8px; }
  </style>
</head>
<body class="p-8">
  <header class="flex items-center mb-6 border-b pb-4">
    <img src="${logoBase64}" alt="Logo" class="mr-4" style="width: 50px; height: 50px;" />
    <div>
      <h1 class="text-3xl font-bold text-gray-800">${lessonPlan.lessonTitle}</h1>
      <p class="text-gray-600">${lessonPlan.subject} • ${lessonPlan.topic} • Level: ${lessonPlan.targetStudentLevel}</p>
    </div>
  </header>

  <div class="grid grid-cols-3 gap-4 mb-8 text-gray-600">
    <p><strong>Subject:</strong> ${lessonPlan.subject}</p>
    <p><strong>Topic:</strong> ${lessonPlan.topic}</p>
    <p><strong>Level:</strong> ${lessonPlan.targetStudentLevel}</p>
    <p><strong>Hours:</strong> ${lessonPlan.estimatedTotalHours} hr</p>
    <p><strong>Lectures:</strong> ${lessonPlan.estimatedNumLectures}</p>
  </div>

  <div class="space-y-8">
    <div class="section"><div class="section-title">${icons.objectives} Learning Objectives</div><div class="pl-10">${list(lessonPlan.learningObjectives)}</div></div>
    <div class="section"><div class="section-title">${icons.prerequisites} Prerequisites</div><div class="pl-10">${list(lessonPlan.prerequisites)}</div></div>
    <div class="section"><div class="section-title">${icons.materials} Materials Needed</div><div class="pl-10">${list(lessonPlan.materialsNeeded)}</div></div>
    <div class="section"><div class="section-title">${icons.strategies} Teaching Strategies</div><div class="pl-10">${list(lessonPlan.teachingStrategies)}</div></div>

    <div class="section"><div class="section-title">${icons.outline} Lesson Outline</div>
      <div class="pl-10 space-y-4">
      ${lessonPlan.lessonOutline?.map(item => `
        <div class="p-4 border-l-4 border-teal-200 bg-teal-50/50 rounded-r-lg">
          <p class="font-bold text-teal-800">${item.section} (${item.time})</p>
          <p class="mt-1"><span class="font-semibold">Teacher:</span> ${item.teacherActions}</p>
          <p class="mt-1"><span class="font-semibold">Students:</span> ${item.studentActions}</p>
        </div>
      `).join('')}
      </div>
    </div>

    <div class="section"><div class="section-title">${icons.lecture} Lecture Wise Plan</div>
      <div class="pl-10 space-y-6">
      ${lessonPlan.stepByStepPlan?.map(lec => `
        <div class="space-y-3">
            <div>
                <p class="font-semibold text-pink-400">${lec.lecture}</p>
                <p>${lec.description}</p>
            </div>
             ${list(lec.slots?.map(slot => `<strong>Slot ${slot.slot} (${slot.timing}):</strong> ${slot.description}`))}
        </div>
      `).join('')}
      </div>
    </div>

    <div class="section"><div class="section-title">${icons.activities} Activities & Practice</div>
      <div class="pl-10 space-y-4">
      ${lessonPlan.activities?.map(act => `
        <div>
            <p class="font-semibold text-purple-800">${act.title}</p>
            <p>${act.description}</p>
        </div>
      `).join('')}
      </div>
    </div>

    <div class="section"><div class="section-title">${icons.assessment} Assessment</div>
      <div class="pl-10 space-y-3">
        <div>
            <p class="font-semibold text-blue-800">Formative (During Class)</p>
            <p>${lessonPlan.assessmentMethods?.formative}</p>
        </div>
        <div>
            <p class="font-semibold text-blue-800">Summative (After Class)</p>
            <p>${lessonPlan.assessmentMethods?.summative}</p>
        </div>
      </div>
    </div>

    <div class="section"><div class="section-title">${icons.homework} Homework</div><div class="pl-10">${list(lessonPlan.homework)}</div></div>

    <div class="section"><div class="section-title">${icons.recap} Recap & Reflection</div>
      <div class="pl-10 space-y-3">
        <div>
          <p class="font-semibold text-red-800">Summary of Key Points</p>
          <p>${lessonPlan.recapAndReflection?.summary}</p>
        </div>
        <div>
           <p class="font-semibold text-red-800">Reflection Questions</p>
           ${list(lessonPlan.recapAndReflection?.reflectionQuestions)}
        </div>
      </div>
    </div>
    
    <div class="section">
        <div class="section-title">${icons.references} References</div>
        <div class="pl-10">
            <ul class="space-y-3">
                <li class="ref-item">
                    ${referenceIcons.activity}
                    <strong>Interactive Class Activity:</strong>
                    <a href="https://lesson-craft-teach.vercel.app/tools/activities" target="_blank" class="ref-link">https://lesson-craft-teach.vercel.app/tools/activities</a>
                </li>
                <li class="ref-item">
                    ${referenceIcons.quiz}
                    <strong>Quiz Maker Challenge:</strong>
                    <a href="https://lesson-craft-teach.vercel.app/tools/quiz-maker" target="_blank" class="ref-link">https://lesson-craft-teach.vercel.app/tools/quiz-maker</a>
                </li>
                <li class="ref-item">
                    ${referenceIcons.exam}
                    <strong>Surprise Test:</strong>
                    <a href="https://lesson-craft-teach.vercel.app/tools/exam-generator" target="_blank" class="ref-link">https://lesson-craft-teach.vercel.app/tools/exam-generator</a>
                </li>
                <li class="ref-item">
                    ${referenceIcons.doubt}
                    <strong>Doubt Solving:</strong>
                    <a href="https://lesson-craft-teach.vercel.app/tools/summarizer" target="_blank" class="ref-link">https://lesson-craft-teach.vercel.app/tools/summarizer</a>
                </li>
                <li class="ref-item">
                    ${referenceIcons.notes}
                    <strong>Notes & PPT:</strong>
                    <a href="https://lesson-craft-teach.vercel.app/tools/notes-generator" target="_blank" class="ref-link">https://lesson-craft-teach.vercel.app/tools/notes-generator</a>
                </li>
            </ul>
        </div>
    </div>

  </div>
</body>
</html>
`;

    const footerTemplate = `
      <div style="width: 100%; font-size: 10px; padding: 0 20mm;
                  display: flex; justify-content: space-between; align-items: center;
                  height: 20px; border-top: 1px solid #e5e7eb; color: #4f46e5;">
             <a href="https://lesson-craft-teach.vercel.app" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: none;">
  lessoncraft.com
</a>
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>
    `;

   await page.setContent(fullHtml, {
  waitUntil: 'domcontentloaded',
  timeout: 15000
});

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate,
      margin: { top: '20mm', bottom: '20mm', right: '20mm', left: '20mm' },
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${lessonPlan.lessonTitle.replace(/\s+/g, '_')}.pdf"`,
      },
    });
    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('PDF generation failed:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Please sign in to download this PDF.' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to generate PDF.', details: error.message },
      { status: 500 }
    );
  }
}