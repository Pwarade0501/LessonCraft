"use client";

import React, { useState } from 'react';
import {
    Book,
    NotebookPen,
    Users,
    Wand2,
    Loader2,
    Download,
    ClipboardList,
    LayoutList,
    CheckCircle2,
    XCircle,
    Clock,
    BookOpenCheck,
    Presentation,
    BookText,
    BotMessageSquare,
    PencilRuler,
    FileText,
    UsersRound,
    ListChecks
} from 'lucide-react';


export default function LessonPlanGeneratorPage() {
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lessonPlan, setLessonPlan] = useState(null);

    const handleGeneratePlan = async (e) => {
        e.preventDefault();
        if (!subject || !topic || !level) {
            alert("Please fill in Subject, Topic, and Level.");
            return;
        }
        setIsLoading(true);
        setLessonPlan(null);
        try {
            const response = await fetch('/api/lesson-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, level }),
            });
            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                throw new Error(`Lesson plan API returned an invalid response (HTTP ${response.status}).`);
            }
            if (!response.ok) {
                throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
            }
            // Ensure we set to null if the response is not what we expect
            setLessonPlan(data.lessonPlan || null);
        } catch (error) {
            console.error("Failed to fetch lesson plan:", error);
            alert(`Failed to generate lesson plan: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    const handleDownload = async () => {
        try {
            const res = await fetch('/api/pdf/generate-lessonplan-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonPlan }),
            });
            if (!res.ok) {
                const responseText = await res.text();
                let data = {};
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch {
                    throw new Error(`PDF service returned an invalid response (HTTP ${res.status}).`);
                }
                throw new Error(data.details || data.error || `PDF generation failed (HTTP ${res.status}).`);
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${lessonPlan.lessonTitle.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download lesson plan PDF:", err);
            alert(`Failed to download PDF: ${err.message}`);
        }
    }
    const InfoCard = ({ icon, title, value }) => (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            {icon}
            <p><span className="font-semibold">{title}:</span> {value}</p>
        </div>
    );

    const Section = ({ icon, title, children }) => (
        <div>
            <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-3">
                {icon} {title}
            </h3>
            <div className="pl-10 text-gray-700">{children}</div>
        </div>
    );

    return (
        <main className="min-h-screen bg-blue-200 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-8">
                    <BookOpenCheck className="w-12 h-12 text-yellow-600" />
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Lesson Plan Generator</h1>
                        <p className="text-lg text-gray-500">Design structured and effective lesson plans with AI.</p>
                    </div>
                </header>

                {/* Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg mb-12">
                    <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <div className="relative">
                                <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                                <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., General Science" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-800" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                            <div className="relative">
                                <NotebookPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                                <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., The Water Cycle" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-800" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="Level" className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                                <select id="Level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-800">
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-yellow-700 active:scale-95 transition-all shadow-md disabled:bg-yellow-300">
                                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                {isLoading ? "Generating Plan..." : "Generate Lesson Plan"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <Loader2 className="w-16 h-16 text-yellow-600 animate-spin mx-auto" />
                        <p className="text-xl font-semibold text-gray-600 mt-4">Building your lesson plan...</p>
                    </div>
                )}

                {/* Lesson Plan Display */}
                {lessonPlan && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">{lessonPlan.lessonTitle}</h2>
                            <button onClick={handleDownload} className="mt-4 sm:mt-0 flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                                <Download size={18} /> Download as PDF
                            </button>
                        </div>

                        {/* Basic Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 text-gray-600">
                            <InfoCard icon={<Book size={20} className="text-blue-500" />} title="Subject" value={lessonPlan.subject} />
                            <InfoCard icon={<NotebookPen size={20} className="text-blue-500" />} title="Topic" value={lessonPlan.topic} />
                            <InfoCard icon={<Users size={20} className="text-blue-500" />} title="Level" value={lessonPlan.targetStudentLevel} />
                            <InfoCard icon={<Clock size={20} className="text-blue-500" />} title="Hours" value={`${lessonPlan.estimatedTotalHours} hr`} />
                            <InfoCard icon={<LayoutList size={20} className="text-blue-500" />} title="Lectures" value={lessonPlan.estimatedNumLectures} />
                        </div>

                        <div className="space-y-8">
                            <Section icon={<CheckCircle2 className="text-green-500" />} title="Learning Objectives">
                                <ul className="list-disc list-outside space-y-2">
                                    {lessonPlan.learningObjectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                                </ul>
                            </Section>

                            <Section icon={<Users className="text-indigo-500" />} title="Prerequisites">
                                <ul className="list-disc list-outside space-y-2">
                                    {lessonPlan.prerequisites?.map((req, i) => <li key={i}>{req}</li>)}
                                </ul>
                            </Section>

                            <Section icon={<ClipboardList className="text-yellow-500" />} title="Materials Needed">
                                <ul className="list-disc list-outside space-y-2">
                                    {lessonPlan.materialsNeeded?.map((mat, i) => <li key={i}>{mat}</li>)}
                                </ul>
                            </Section>
                            <Section icon={<Presentation className="text-purple-400" />} title="Teaching Strategies">
                                <ul className="list-disc list-outside space-y-2">
                                    {lessonPlan.teachingStrategies?.map((mat, i) => <li key={i}>{mat}</li>)}
                                </ul>
                            </Section>
                            <Section icon={<LayoutList className="text-teal-500" />} title="Lesson Outline">
                                {lessonPlan.lessonOutline?.map((item, i) => (
                                    <div key={i} className="mb-4 p-4 border-l-4 border-teal-200 bg-teal-50/50 rounded-r-lg">
                                        <p className="font-bold text-teal-800">{item.section} ({item.time})</p>
                                        <p className="mt-1"><span className="font-semibold">Teacher:</span> {item.teacherActions}</p>
                                        <p className="mt-1"><span className="font-semibold">Students:</span> {item.studentActions}</p>
                                    </div>
                                ))}
                            </Section>
                            <Section icon={<BookText className="text-pink-500" />} title="Lecture Wise Plan">
                                <div className="space-y-6">
                                    {lessonPlan.stepByStepPlan?.map((lectureItem, index) => (
                                        <div key={index} className="space-y-3">
                                            <div>
                                                <p className="font-semibold text-pink-400">{lectureItem.lecture}</p>
                                                <p>{lectureItem.description}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-pink-400">Slots</p>
                                                <ul className="list-disc list-outside pl-5 space-y-1">
                                                    {lectureItem.slots.map((slot, slotIndex) => (
                                                        <li key={slotIndex}>
                                                            <strong>Slot {slot.slot} ({slot.timing}):</strong> {slot.description}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section icon={<Wand2 className="text-purple-500" />} title="Activities & Practice">
                                <div className="space-y-4">
                                    {lessonPlan.activities?.map((act, i) => (
                                        <div key={i}>
                                            <p className="font-semibold text-purple-800">{act.title}</p>
                                            <p>{act.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section icon={<NotebookPen className="text-blue-500" />} title="Assessment">
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-blue-800">Formative (During Class)</p>
                                        <p>{lessonPlan.assessmentMethods?.formative}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-800">Summative (After Class)</p>
                                        <p>{lessonPlan.assessmentMethods?.summative}</p>
                                    </div>
                                </div>
                            </Section>

                            <Section icon={<Book className="text-orange-500" />} title="Homework / Follow-Up">
                                <ul className="list-disc list-outside space-y-2">
                                    {lessonPlan.homework?.map((task, i) => <li key={i}>{task}</li>)}
                                </ul>
                            </Section>


                            <Section icon={<XCircle className="text-red-500" />} title="Recap & Reflection">
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-red-800">Summary of Key Points</p>
                                        <p>{lessonPlan.recapAndReflection?.summary}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-red-800">Reflection Questions</p>
                                        <ul className="list-disc list-outside pl-5 space-y-1">
                                            {lessonPlan.recapAndReflection?.reflectionQuestions?.map((q, i) => <li key={i}>{q}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </Section>
                            <Section icon={<ListChecks className="text-indigo-500" />} title="References">
                                <ul className="space-y-4">
                                    {[
                                        {
                                            icon: <UsersRound className="w-6 h-6 text-pink-600 flex-shrink-0" />,
                                            label: "Interactive Class Activity",
                                            href: "https://lesson-craft-teach.vercel.app/activities",
                                        },
                                        {
                                            icon: <PencilRuler className="w-6 h-6 text-green-600 flex-shrink-0" />,
                                            label: "Quiz Maker Challenge",
                                            href: "https://lesson-craft-teach.vercel.app/quiz-maker",
                                        },
                                        {
                                            icon: <FileText className="w-6 h-6 text-red-600 flex-shrink-0" />,
                                            label: "Surprise Test",
                                            href: "https://lesson-craft-teach.vercel.app/exam-generator",
                                        },
                                        {
                                            icon: <BotMessageSquare className="w-6 h-6 text-purple-600 flex-shrink-0" />,
                                            label: "Doubt Solving",
                                            href: "https://lesson-craft-teach.vercel.app/summarizer",
                                        },
                                        {
                                            icon: <BookText className="w-6 h-6 text-blue-600 flex-shrink-0" />,
                                            label: "Notes & PPT",
                                            href: "https://lesson-craft-teach.vercel.app/notes-generator",
                                        },
                                    ].map((ref, idx) => (
                                        <li
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-2">
                                                {ref.icon}
                                                <strong className="text-gray-800">{ref.label}:</strong>
                                            </div>
                                            <a
                                                href={ref.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline break-all text-sm sm:text-base"
                                            >
                                                {ref.href}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </Section>

                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
