import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject, map, switchMap,
} from 'rxjs';
import {
  filter, shareReplay, startWith, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { storageCardElements } from 'app/pages/system/advanced/storage/storage-card/storage-card.elements';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@UntilDestroy()
@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class StorageCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  private storageSettings: { systemDsPool: string };
  protected readonly searchableElements = storageCardElements;
  protected readonly requiredRoles = [Role.DatasetWrite];

  readonly storageSettings$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('systemdataset.config').pipe(map((config) => config.pool))),
    map((systemDsPool) => ({ systemDsPool })),
    tap((config) => this.storageSettings = config),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private slideIn: SlideIn,
    private firstTimeWarning: FirstTimeWarningService,
    private api: ApiService,
  ) {}

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(StorageSettingsFormComponent, { data: this.storageSettings })),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
