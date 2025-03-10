import { Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExamInfoInputComponent } from './exam-info-input/exam-info-input.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'student-exam-analyzer';
}
