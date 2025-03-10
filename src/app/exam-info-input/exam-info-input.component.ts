import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exam-info-input',
  imports: [FormsModule, NgFor],
  templateUrl: './exam-info-input.component.html',
  styleUrl: './exam-info-input.component.css'
})
export class ExamInfoInputComponent {
  // DERSLER
  courses = ['Türkçe', 'Fen Bilgisi', 'Din Kültürü', 'Matematik', 'İngilizce', 'Sosyal Bilgiler'];
  // SEÇİLEN DERS
  selectedCourse: string = '';
  // CEVAP ANAHTARLARI
  answerSheetA: string = '';
  questionReferenceA: string = ''; 
  // KAZANIMLAR 
  questionTopics: string = '';

  studentNames: string = '';  // To hold student names input (split by line)
  examType: string = '';  // To hold the exam type (A or B)
  studentAnswers: string = '';  // To hold student answers input (split by line)

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedData = localStorage.getItem('examData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      this.selectedCourse = parsedData.courseName;
      this.answerSheetA = parsedData.answerSheetA;
      this.questionReferenceA = parsedData.questionReferenceA;
      this.questionTopics = parsedData.questionTopics;
      this.studentNames = parsedData.studentNames;
      this.examType = parsedData.examType;
      this.studentAnswers = parsedData.studentAnswers;
    }
  }

  onCourseChange() {
    console.log('Selected course:', this.selectedCourse);
  }

  onSubmit() {
    console.log('Course:', this.selectedCourse);
    console.log('Answer Sheet A:', this.answerSheetA.split('\n'));
    console.log('Question Reference A:', this.questionReferenceA.split('\n'));
    console.log('Question Topics:', this.questionTopics.split('\n'));
    console.log('Student Names:', this.studentNames.split('\n'));
    console.log('Exam Type:', this.examType.split('\n'));
    console.log('Student Answers:', this.studentAnswers.split('\n'));
  
    const analysisData = {
      courseName: this.selectedCourse,
      answerSheetA: this.answerSheetA,             // Added Answer Sheet A
      questionReferenceA: this.questionReferenceA, // Added Question Reference A
      questionTopics: this.questionTopics,
      studentNames: this.studentNames,
      examType: this.examType,
      studentAnswers: this.studentAnswers
    };
    localStorage.setItem('examData', JSON.stringify(analysisData));
    this.router.navigate(['/exam-analysis'], { state: { analysisData } });
  }
}
