import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

// Sadece kursa özgü alanlar bu interface içinde
interface ExamInput {
  courseName: string;
  answerSheetA: string;
  questionReferenceA: string;
  questionTopics: string;
  studentAnswers: string;
}

interface OverallAverages {
  correct: number;
  wrong: number;
  notAnswered: number;
}

interface QuestionAnalysis {
  correctCount: number;
  wrongCount: number;
  notAnsweredCount: number;
  correctStudents: string[];
  wrongStudents: string[];
  notAnsweredStudents: string[];
}

interface ExamAnalysis {
  courseName: string;
  overallAverages: OverallAverages;
  questionsAnalysis: QuestionAnalysis[];
  topics: string[];
  questionReference: string[];
  numStudents: number;
  totalQuestions: number;
}

@Component({
  selector: 'app-exam-info-input',
  templateUrl: './exam-info-input.component.html',
  styleUrls: ['./exam-info-input.component.css'],
  imports: [FormsModule, NgFor]
})
export class ExamInfoInputComponent {

  // Her ders için tekrar eden alanlar (kursa özgü)
  examInputs: ExamInput[] = Array.from({ length: 10 }, () => ({
    courseName: '',
    answerSheetA: '',
    questionReferenceA: '',
    questionTopics: '',
    studentAnswers: ''
  }));

  // Global alanlar: her sınav için tek sefer girilecek
  globalStudentNames: string = '';
  globalExamType: string = '';

  // Tüm derslerde kullanılacak kurs listesi
  courses = ['Türkçe', 'Fen Bilgisi', 'Din Kültürü', 'Matematik', 'İngilizce', 'Sosyal Bilgiler'];

  constructor(private router: Router) { }

  // Global alanlar için ayrı kaydetme yapılabilir.
  private saveGlobalData() {
    localStorage.setItem('examData', JSON.stringify({
      examInputs: this.examInputs,
      globalStudentNames: this.globalStudentNames,
      globalExamType: this.globalExamType
    }));
  }

  onSubmitAndDownload(): void {
    // Sadece kursa özgü alanlara göre boş olmayan examInputs filtreleniyor.
    const filledExamInputs = this.examInputs.filter(input =>
      input.courseName.trim() !== '' ||
      input.answerSheetA.trim() !== '' ||
      input.questionReferenceA.trim() !== '' ||
      input.questionTopics.trim() !== '' ||
      input.studentAnswers.trim() !== ''
    );

    const analyses: ExamAnalysis[] = [];

    // Global olarak girilen öğrenci isimleri ve sınav tipi
    const studentNames = (this.globalStudentNames || '')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s !== '');
    const examTypeArray = (this.globalExamType || '')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s !== '');

    // Her doldurulan examInput için analiz işlemi
    filledExamInputs.forEach((input) => {
      // Kursa özgü alanların işlenmesi:
      const correctAnswers = (input.answerSheetA || '')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s !== '');
      const topics = (input.questionTopics || '')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s !== '');
      const questionRefs = (input.questionReferenceA || '')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s !== '');
      const studentAnswersRaw = (input.studentAnswers || '')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s !== '');

      const numStudents = studentNames.length;
      const totalQuestions = correctAnswers.length;

      // Her soru için başlangıçta analiz verisi oluşturuluyor.
      const questionsAnalysis: QuestionAnalysis[] = [];
      for (let q = 0; q < totalQuestions; q++) {
        questionsAnalysis.push({
          correctCount: 0,
          wrongCount: 0,
          notAnsweredCount: 0,
          correctStudents: [],
          wrongStudents: [],
          notAnsweredStudents: []
        });
      }

      // Öğrenci cevapları, her öğrenci için harf harf diziye dönüştürülüyor.
      const studentAnswers: string[][] = studentAnswersRaw.map(sa =>
        sa.split('').map(s => s.trim())
      );

      let totalCorrect = 0;
      let totalWrong = 0;
      let totalNotAnswered = 0;

      // Her öğrenci için cevap kontrolü:
      for (let s = 0; s < numStudents; s++) {
        const answers = studentAnswers[s];
        // Eğer sınav tipi girilmemişse varsayılan "A" alınıyor.
        const studentExamType = examTypeArray[s] ? examTypeArray[s].toUpperCase() : 'A';

        for (let q = 0; q < totalQuestions; q++) {
          const correctAnswer = correctAnswers[q];
          let studentAnswer = '';

          if (studentExamType === 'B') {
            const mappedIndex = questionRefs[q] ? Number(questionRefs[q]) - 1 : q;
            studentAnswer = answers[mappedIndex] || '';
          } else {
            studentAnswer = answers[q] || '';
          }

          if (studentAnswer === 'X') {
            questionsAnalysis[q].notAnsweredCount++;
            questionsAnalysis[q].notAnsweredStudents.push(studentNames[s]);
            totalNotAnswered++;
          } else if (studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
            questionsAnalysis[q].correctCount++;
            questionsAnalysis[q].correctStudents.push(studentNames[s]);
            totalCorrect++;
          } else {
            questionsAnalysis[q].wrongCount++;
            questionsAnalysis[q].wrongStudents.push(studentNames[s]);
            totalWrong++;
          }
        }
      }

      const overallAverages: OverallAverages = {
        correct: numStudents > 0 ? parseFloat((totalCorrect / numStudents).toFixed(1)) : 0,
        wrong: numStudents > 0 ? parseFloat((totalWrong / numStudents).toFixed(1)) : 0,
        notAnswered: numStudents > 0 ? parseFloat((totalNotAnswered / numStudents).toFixed(1)) : 0,
      };

      const examAnalysis: ExamAnalysis = {
        courseName: input.courseName,
        overallAverages,
        questionsAnalysis,
        topics,
        questionReference: questionRefs,
        numStudents,
        totalQuestions
      };

      analyses.push(examAnalysis);
    });

    this.saveGlobalData(); // Global ve kurs verilerini kaydet
    this.downloadExcelReport(analyses);
  }

  // Generate an Excel workbook from the analysis data and trigger a download.
  async downloadExcelReport(analyses: ExamAnalysis[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
  
    analyses.forEach((analysis, index) => {
      const sheetName = analysis.courseName || `Exam ${index + 1}`;
      const worksheet = workbook.addWorksheet(sheetName);
  
      // 6 sütun: Genişlikler normalin 2 katı (örneğin 20)
      worksheet.columns = [
        { key: 'col1', width: 20 },
        { key: 'col2', width: 20 },
        { key: 'col3', width: 20 },
        { key: 'col4', width: 20 },
        { key: 'col5', width: 20 },
        { key: 'col6', width: 20 }
      ];
  
      // --- Üst Başlık Bölümü ---
      const headerText = `${analysis.courseName} KAZANIM RAPORU`.toUpperCase();
      const headerRow = worksheet.addRow([headerText]);
      headerRow.font = { bold: true, size: 24 };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`A${headerRow.number}:F${headerRow.number}`);
      headerRow.height = 30;
      headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '9fe6ff' } // Yeşil arkaplan
        };
      });
  
      const avgHeaderRow = worksheet.addRow([
        "DOĞRU ORTALAMA", "", "YANLIŞ ORTALAMA", "", "BOŞ ORTALAMA", ""
      ]);
      worksheet.mergeCells(`A${avgHeaderRow.number}:B${avgHeaderRow.number}`);
      worksheet.mergeCells(`C${avgHeaderRow.number}:D${avgHeaderRow.number}`);
      worksheet.mergeCells(`E${avgHeaderRow.number}:F${avgHeaderRow.number}`);
      avgHeaderRow.alignment = { horizontal: 'center', vertical:'middle' };
      avgHeaderRow.font = {bold: true, size: 14}
      avgHeaderRow.height = 20;
      avgHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
  
      const avgValueRow = worksheet.addRow([
        analysis.overallAverages.correct, "",
        analysis.overallAverages.wrong, "",
        analysis.overallAverages.notAnswered, ""
      ]);
      worksheet.mergeCells(`A${avgValueRow.number}:B${avgValueRow.number}`);
      worksheet.mergeCells(`C${avgValueRow.number}:D${avgValueRow.number}`);
      worksheet.mergeCells(`E${avgValueRow.number}:F${avgValueRow.number}`);
      avgValueRow.alignment = { horizontal: 'center', vertical: 'middle' };
      avgValueRow.height = 20;
      avgValueRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
  
      worksheet.addRow([]);
  
      // --- Sorular Bölümü ---
      for (let q = 0; q < analysis.totalQuestions; q++) {
        const questionHeaderRow = worksheet.addRow([]);
        const questionNumberText = `A${q + 1}.-B${analysis.questionReference[q] || 'N/A'} SORU`;
        const questionTopic = analysis.topics[q] || 'No Topic Provided';
        questionHeaderRow.getCell(1).value = questionNumberText;
        questionHeaderRow.getCell(2).value = questionTopic;
        questionHeaderRow.font = {bold: true, size: 14}
        questionHeaderRow.height = 20;
        worksheet.mergeCells(`B${questionHeaderRow.number}:F${questionHeaderRow.number}`);
        questionHeaderRow.alignment = { horizontal: 'center' };
        questionHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'c6c2ff' } // Yeşil arkaplan
          };
        });
  
        const labelRow = worksheet.addRow([]);
        labelRow.getCell(1).value = 'DOĞRU YAPAN SAYISI';
        labelRow.getCell(3).value = 'YANLIŞ YAPAN SAYISI';
        labelRow.getCell(5).value = 'BOŞ YAPAN SAYISI';
        labelRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'dfffc2' } // Yeşil arkaplan
        };
        labelRow.getCell(3).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ffb8b8' } // Yeşil arkaplan
        };
        labelRow.getCell(5).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fff2b8' } // Yeşil arkaplan
        };
        worksheet.mergeCells(`A${labelRow.number}:B${labelRow.number}`);
        worksheet.mergeCells(`C${labelRow.number}:D${labelRow.number}`);
        worksheet.mergeCells(`E${labelRow.number}:F${labelRow.number}`);
        labelRow.alignment = { horizontal: 'center' };
        labelRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
  
        const countRow = worksheet.addRow([]);
        const qa = analysis.questionsAnalysis[q];
        countRow.getCell(1).value = qa.correctCount;
        countRow.getCell(3).value = qa.wrongCount;
        countRow.getCell(5).value = qa.notAnsweredCount;
        worksheet.mergeCells(`A${countRow.number}:B${countRow.number}`);
        worksheet.mergeCells(`C${countRow.number}:D${countRow.number}`);
        worksheet.mergeCells(`E${countRow.number}:F${countRow.number}`);
        countRow.alignment = { horizontal: 'center' };
        countRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
  
        // Öğrenci İsimlerinin Listesi
        const correctStudents = qa.correctStudents;
        const wrongStudents = qa.wrongStudents;
        const notAnsweredStudents = qa.notAnsweredStudents;
        const maxNames = Math.max(correctStudents.length, wrongStudents.length, notAnsweredStudents.length);
        const studentStartRow = worksheet.lastRow!.number + 1; // Non-null assertion
        for (let i = 0; i < maxNames; i++) {
          const studentRow = worksheet.addRow([]);
          if (i < correctStudents.length) {
            studentRow.getCell(1).value = correctStudents[i];
          }
          if (i < wrongStudents.length) {
            studentRow.getCell(3).value = wrongStudents[i];
          }
          if (i < notAnsweredStudents.length) {
            studentRow.getCell(5).value = notAnsweredStudents[i];
          }
          worksheet.mergeCells(`A${studentRow.number}:B${studentRow.number}`);
          worksheet.mergeCells(`C${studentRow.number}:D${studentRow.number}`);
          worksheet.mergeCells(`E${studentRow.number}:F${studentRow.number}`);
          studentRow.alignment = { horizontal: 'center' };
        }
        const studentEndRow = worksheet.lastRow!.number; // Non-null assertion
  
        const setGroupBorder = (startRow: number, endRow: number, leftCol: string, rightCol: string) => {
          for (let r = startRow; r <= endRow; r++) {
            const leftCell = worksheet.getCell(`${leftCol}${r}`);
            const rightCell = worksheet.getCell(`${rightCol}${r}`);
            if (r === startRow) {
              leftCell.border = { ...leftCell.border, top: { style: 'thin' } };
              rightCell.border = { ...rightCell.border, top: { style: 'thin' } };
            }
            if (r === endRow) {
              leftCell.border = { ...leftCell.border, bottom: { style: 'thin' } };
              rightCell.border = { ...rightCell.border, bottom: { style: 'thin' } };
            }
            leftCell.border = { ...leftCell.border, left: { style: 'thin' } };
            rightCell.border = { ...rightCell.border, right: { style: 'thin' } };
          }
        };
        setGroupBorder(studentStartRow, studentEndRow, 'A', 'B');
        setGroupBorder(studentStartRow, studentEndRow, 'C', 'D');
        setGroupBorder(studentStartRow, studentEndRow, 'E', 'F');
  
        worksheet.addRow([]);
      }
    });
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
      [buffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    saveAs(blob, 'Exam_Analysis_Report.xlsx');
  }
  


}
