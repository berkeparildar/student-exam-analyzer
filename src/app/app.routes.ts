import { Routes } from '@angular/router';
import { ExamInfoInputComponent } from './exam-info-input/exam-info-input.component';
import { ExamAnalysisComponent } from './exam-analysis/exam-analysis.component';

export const routes: Routes = [
    { path: '', component: ExamInfoInputComponent },
    { path: 'exam-analysis', component: ExamAnalysisComponent }
];
