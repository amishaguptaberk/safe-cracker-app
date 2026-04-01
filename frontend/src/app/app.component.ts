import { Component, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  private http = inject(HttpClient);

  combo = '';
  attempts = 0;
  timeTaken: number | null = null;
  done = false;
  running = false;
  started = false;
  errorMsg = '';

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  startCrack() {
    this.errorMsg = '';
    this.started = false;
    this.done = false;
    this.attempts = 0;
    this.timeTaken = null;
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.running = true;

    this.http.post<{ job_id?: string; error?: string }>('/api/crack_safe', {
      actual_combination: this.combo
    }).subscribe({
      next: (data) => {
        if (data.error) {
          this.errorMsg = data.error;
          this.running = false;
          return;
        }
        this.started = true;
        this.poll(data.job_id!);
        this.pollInterval = setInterval(() => this.poll(data.job_id!), 100);
      },
      error: () => {
        this.errorMsg = 'Request failed';
        this.running = false;
      }
    });
  }

  private poll(jobId: string) {
    this.http.get<{ attempts: number; done: boolean; time_taken: number | null }>(
      `/api/status/${jobId}`
    ).subscribe({
      next: (data) => {
        this.attempts = data.attempts;
        if (data.done) {
          clearInterval(this.pollInterval!);
          this.timeTaken = data.time_taken;
          this.done = true;
          this.running = false;
        }
      },
      error: () => {
        clearInterval(this.pollInterval!);
        this.errorMsg = 'Lost connection';
        this.running = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}
