import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss'],
  standalone: false,
})
export class StatsCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() trend = 0;
  @Input() trendUp = true;
  @Input() icon = 'stats-chart-outline';
  @Input() color: 'green' | 'amber' | 'purple' | 'blue' = 'green';
}
