import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { NgxPrintModule } from 'ngx-print';

// Optional interface for per‑question analysis details.
interface QuestionAnalysis {
  correctCount: number;
  wrongCount: number;
  notAnsweredCount: number;
  correctStudents: string[];
  wrongStudents: string[];
  notAnsweredStudents: string[];
}

@Component({
  selector: 'app-exam-analysis',
  templateUrl: './exam-analysis.component.html',
  styleUrls: ['./exam-analysis.component.css'],
  imports: [CommonModule, NgxPrintModule],
})
export class ExamAnalysisComponent implements OnInit {
  analysisData: any; // Data passed via router state from the previous page.

  // Overall averages (averages per student).
  overallAverages: { correct: number; wrong: number; notAnswered: number } = {
    correct: 0,
    wrong: 0,
    notAnswered: 0
  };

  // Per-question (gaining) analysis details.
  questionsAnalysis: QuestionAnalysis[] = [];
  // We'll store the question topics (gaining labels) here.
  topics: string[] = [];
  questionReference: string[] = [];

  numStudents: number = 0;

  constructor() { }

  ngOnInit(): void {
    // Get the data from the previous page (submitted via router state)
    this.analysisData = history.state.analysisData;
    console.log('Received analysisData:', this.analysisData);
    if (!this.analysisData) {
      console.error('No analysis data available.');
      return;
    }
  
    // Parse correct answers (A-type answer sheet)
    const correctAnswers: string[] = (this.analysisData.answerSheetA || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '');
  
    // Parse question topics
    this.topics = (this.analysisData.questionTopics || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '');
  
    // Parse question references (mapping for B-type)
    const questionReference: string[] = (this.analysisData.questionReferenceA || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '');
    this.questionReference = questionReference;
    
    // Parse student names
    const studentNames: string[] = Array.isArray(this.analysisData.studentNames)
      ? this.analysisData.studentNames
      : (typeof this.analysisData.studentNames === 'string'
          ? this.analysisData.studentNames.split('\n')
              .map((s: string) => s.trim())
              .filter((s: string) => s !== '')
          : []);
  
    // Parse student answers
    const studentAnswersRaw: string[] = (this.analysisData.studentAnswers || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '');
  
    // Parse exam types (A or B for each student)
    const examTypeArray: string[] = (this.analysisData.examType || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '');
  
    // (Optional) Save examType array in a property if needed
    // this.examType = examTypeArray; // if you declared: examType: string[] = [];
  
    console.log('Correct Answers:', correctAnswers);
    console.log('Student Names:', studentNames);
    console.log('Student Answers Raw:', studentAnswersRaw);
    console.log('Exam Types:', examTypeArray);
    console.log('Question Reference:', questionReference);
  
    this.numStudents = studentNames.length;
    const totalQuestions = correctAnswers.length;
  
    // Each student's answers are assumed to be a single string, split into individual characters.
    const studentAnswers: string[][] = studentAnswersRaw.map(sa =>
      sa.split('').map(s => s.trim())
    );
  
    // Initialize analysis for each question.
    this.questionsAnalysis = [];
    for (let i = 0; i < totalQuestions; i++) {
      this.questionsAnalysis.push({
        correctCount: 0,
        wrongCount: 0,
        notAnsweredCount: 0,
        correctStudents: [],
        wrongStudents: [],
        notAnsweredStudents: []
      });
    }
  
    // Totals for overall averages.
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalNotAnswered = 0;
  
    // For each student, loop through each question.
    for (let s = 0; s < this.numStudents; s++) {
      const answers = studentAnswers[s];
      // Determine the student's exam type; default to A if not provided.
      const studentExamType = examTypeArray[s] ? examTypeArray[s].toUpperCase() : 'A';
  
      for (let q = 0; q < totalQuestions; q++) {
        const correctAnswer = correctAnswers[q];
        let studentAnswer: string = '';
  
        if (studentExamType === 'B') {
          // For type B, map the question index using questionReference.
          // Assume questionReference[q] contains the B-type question number.
          const mappedIndex = Number(questionReference[q]) - 1; // convert to 0-indexed
          studentAnswer = answers[mappedIndex] || '';
        } else {
          // For type A, use the q-th answer directly.
          studentAnswer = answers[q] || '';
        }
  
        // Check the answer
        if (studentAnswer === 'X') {
          this.questionsAnalysis[q].notAnsweredCount++;
          this.questionsAnalysis[q].notAnsweredStudents.push(studentNames[s]);
          totalNotAnswered++;
        } else if (studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
          this.questionsAnalysis[q].correctCount++;
          this.questionsAnalysis[q].correctStudents.push(studentNames[s]);
          totalCorrect++;
        } else {
          this.questionsAnalysis[q].wrongCount++;
          this.questionsAnalysis[q].wrongStudents.push(studentNames[s]);
          totalWrong++;
        }
      }
    }
  
    // Optionally sort student names alphabetically for each question.
    for (let i = 0; i < totalQuestions; i++) {
      this.questionsAnalysis[i].wrongStudents.sort();
      this.questionsAnalysis[i].notAnsweredStudents.sort();
      this.questionsAnalysis[i].correctStudents.sort();
    }
  
    // Compute overall averages per student.
    this.overallAverages.correct = parseFloat((totalCorrect / this.numStudents).toFixed(1));
    this.overallAverages.wrong = parseFloat((totalWrong / this.numStudents).toFixed(1));
    this.overallAverages.notAnswered = parseFloat((totalNotAnswered / this.numStudents).toFixed(1));
  }
  
  getQuestionIndices(): number[] {
    return this.questionsAnalysis.map((_, index) => index);
  }
}
