import { ActivatedRoute } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { JhiAlertService, JhiDataUtils, JhiLanguageService } from 'ng-jhipster';
import { Game, IGame } from 'app/shared/model/game.model';
import { TrainingTeacherService } from 'app/entities/training-teacher/training-teacher.service';
import { ITrainingTeacher } from 'app/shared/model/training-teacher.model';
import { GameResultService } from 'app/entities/game-result';
import * as moment from 'moment';
import { Moment } from 'moment';
import { log } from 'util';
import { GameFormat, GameResult, IGameResult } from 'app/shared/model/game-result.model';
import { Observable } from 'rxjs';
import { OnInit, Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AccountService } from 'app/core';
import { RedirectService } from 'app/businesslogic/redirect/redirect.service';

@Component({
  selector: 'jhi-kindergarten-detail',
  templateUrl: './flashcards.component.html'
})
export class FlashcardsComponent implements OnInit {
  @ViewChild('result', { static: false }) focusElement: ElementRef;

  currentAccount: any;

  isTraining = false;

  winsRequired = 10;
  winsCount = 0;

  trainingColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  currentITrainingTeacher: ITrainingTeacher = null;

  isSaving: boolean;
  isStarted = false;
  isDisplayed = true;
  gamesList: IGame[];
  game: IGame;
  digits: Number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  values: Number[] = [];
  rows = 3;
  players = 1;
  playersSelection = 1;
  duration = 1.5;
  impulse = 2;
  impulseSelection = 3;
  rowsIter = Array(this.rows)
    .fill(0)
    .map((x, i) => i);
  columns = 1;
  type = 1;
  max = 6;
  errors = 0;
  error = false;
  gameResult: IGameResult;
  gameStarted: Moment;
  gameEnded: Moment;
  typeFlag1 = false;
  typeFlag2 = false;
  typeFlag3 = false;
  typeFlag4 = false;
  timer: any;
  subscription: Subscription;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected jhiAlertService: JhiAlertService,
    protected dataUtils: JhiDataUtils,
    protected gameResultService: GameResultService,
    protected languageService: JhiLanguageService,
    protected trainingTeacherService: TrainingTeacherService,
    protected accountService: AccountService,
    protected redirectService: RedirectService
  ) {}

  ngOnInit() {
    var obj = this as object;
    ///console.log(this.name) // hello

    this.accountService.identity().then(account => {
      this.currentAccount = account;
      this.trainingTeacherService
        .findNotCompletedForUserByTrainingId(28)
        .pipe(
          filter((mayBeOk: HttpResponse<ITrainingTeacher[]>) => mayBeOk.ok),
          map((response: HttpResponse<ITrainingTeacher[]>) => response.body)
        )
        .subscribe(
          (res: ITrainingTeacher[]) => {
            res.forEach(t => {
              eval(t.training.conditions);
              this.impulseSelection = 10;
              log('ProcessingL: ' + t);
              this.isTraining = true;
              this.currentITrainingTeacher = t;
            });
          },
          (res: HttpErrorResponse) => this.onError(res.message)
        );
    });

    this.prepareDataForSpecificFormat();
    if (this.isTraining) {
      this.impulseSelection = 10;
    }
    this.resetImpulse();
  }

  resetImpulse() {
    this.impulse = this.impulseSelection;
  }

  resetValue() {
    this.isDisplayed = true;
    this.subscription === null || this.subscription === undefined ? undefined : this.subscription.unsubscribe();
    this.timer = timer(this.duration * 1000);
    this.subscription = this.timer.subscribe(t => {
      this.isDisplayed = false;
    });
    this.error = false;
  }

  resetPlayers() {
    this.players = this.playersSelection;
  }

  prepareDataForSpecificFormat() {
    this.rowsIter = Array(this.rows)
      .fill(0)
      .map((x, i) => i);
    for (const iter of this.rowsIter) {
      log('iter:' + iter);
    }
    // this.iter = []    ;
    // for (let i = 0; i < this.max; i++) {
    //   this.iter.push(i);
    // }
    this.loadAll();
    this.gameResult = new GameResult();
  }

  previousState() {
    window.history.back();
  }

  handleFlashColumnsSelection($event) {
    this.columns = +$event.target.value;
  }

  handleFlashPlayersSelection($event) {
    this.players = +$event.target.value;
  }

  handleGameRowsSelection($event) {
    this.rows = +$event.target.value;
  }

  handleFlashDurationSelection($event) {
    this.duration = +$event.target.value;
  }

  handleFlashImpulseSelection($event) {
    this.impulse = +$event.target.value;
  }

  handleFlashDigitsSelection($event) {
    log(this.digits + '');
  }

  handleGameTypeSelection($event) {
    if ($event.target.value === '1') {
      this.type = 1;
      // this.gameResult.gameFormat = GameFormat.SIZE4x4;
    }
    if ($event.target.value === '2') {
      this.type = 2;
      // this.gameResult.gameFormat = GameFormat.SIZE5x5;
    }
    if ($event.target.value === '3') {
      this.type = 3;
      // this.gameResult.gameFormat = GameFormat.SIZE6x6;
    }
    if ($event.target.value === '4') {
      this.type = 4;
      // this.gameResult.gameFormat = GameFormat.SIZE6x6;
    }
  }

  callGenerate() {
    this.generate();
    setTimeout(() => this.focusElement.nativeElement.focus());
  }

  generate() {
    this.values = [];
    for (let i = 0; i < this.columns; i++) {
      let randomElement = this.digits[Math.floor(Math.random() * this.digits.length)];
      this.values.push(randomElement);
    }
    this.gameStarted = moment(new Date());
    this.isStarted = true;
    this.resetValue();
    if (this.isTraining) {
      this.impulseSelection = 10;
    }
  }

  doComplete(resultValue: string, $event): boolean {
    if (resultValue.length < this.columns) {
      return false;
    }
    for (let i = 0; i < this.columns; i++) {
      if (this.values[i] + '' !== resultValue.charAt(resultValue.length - i - 1)) {
        this.error = true;
        if (this.isTraining) {
          $event.target.value = '';
          this.generate();
          this.resetValue();
          this.winsCount = 0;
          setTimeout(() => this.focusElement.nativeElement.focus());
        }
        return false;
      }
    }

    if (this.isTraining && this.winsCount < this.winsRequired) {
      this.winsCount++;
      $event.target.value = '';
      this.generate();
      this.resetValue();
      if (this.winsCount === this.winsRequired) {
        // todo place to save results
        if (this.isTraining) {
          log('Sending result to server');
          this.currentITrainingTeacher.result = true;
          this.currentITrainingTeacher.exported = false;
          this.subscribeToSaveResponseReload(this.trainingTeacherService.update(this.currentITrainingTeacher));
          this.isTraining = false;
        }
        this.isStarted = false;
      } else {
        setTimeout(() => this.focusElement.nativeElement.focus());
      }
    } else {
      this.error = false;

      $event.target.value = '';
      this.impulse = this.impulse - 1;
      if (this.impulse === 0) {
        this.resetImpulse();
        this.players = this.players - 1;
        if (this.players === 0) {
          this.isStarted = false;
          this.resetPlayers();
        } else {
          setTimeout(() => this.focusElement.nativeElement.focus());
        }
      } else {
        this.generate();
      }
      this.resetValue();
      return true;
    }
  }

  saveGameResult() {
    const durationTosave = this.gameEnded.unix() - this.gameStarted.unix();
    this.gameResult.executionTimeSeconds = durationTosave;
    this.gameResult.game = new Game();
    this.gameResult.game.id = 28;
    this.gameResult.gameFormat = 'FlashCardCol' + this.columns + 'Row' + this.rows + 'Dig' + this.digits + 'Type' + this.type;
    this.gameResult.endedTime = moment(new Date());
    // this.gameResult.gameStartData = JSON.stringify(this.originalCells);
    // this.gameResult.gameEndData = JSON.stringify(this.cells);
    this.gameResult.errorsCount = this.errors;
    this.subscribeToSaveResponse(this.gameResultService.createForUser(this.gameResult));
    this.gameResult = new GameResult();
    this.errors = 0;
  }

  loadAll() {}

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IGameResult>>) {
    result.subscribe(() => this.onSaveSuccess(), () => this.onSaveError());
  }

  protected subscribeToSaveResponseReload(result: Observable<HttpResponse<ITrainingTeacher>>) {
    result.subscribe(() => this.onSaveSuccess(), () => this.onSaveError());
  }

  protected onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }

  protected onSaveSuccessReload() {
    this.isSaving = false;
    this.isStarted = false;
    location.reload();
  }

  protected onSaveSuccess() {
    this.isSaving = false;
    this.isStarted = false;
    this.redirectService.redirect(
      this.currentITrainingTeacher.training.subject.id,
      this.currentITrainingTeacher.training.identificator,
      this.currentITrainingTeacher.teacher.id
    );
  }

  protected onSaveError() {
    this.isSaving = false;
    this.isStarted = false;
  }
}
