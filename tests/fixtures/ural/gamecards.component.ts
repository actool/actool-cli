import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { filter, map } from 'rxjs/operators';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { JhiAlertService, JhiDataUtils, JhiLanguageService } from 'ng-jhipster';
import { Game, IGame } from 'app/shared/model/game.model';
import { GameService } from 'app/entities/game';
import { GameResultService } from 'app/entities/game-result';
import * as moment from 'moment';
import { Moment } from 'moment';
import { log } from 'util';
import { GameFormat, GameResult, IGameResult } from 'app/shared/model/game-result.model';
import { Observable } from 'rxjs';

import { TrainingTeacherService } from 'app/entities/training-teacher/training-teacher.service';
import { ITrainingTeacher } from 'app/shared/model/training-teacher.model';
import { AccountService } from 'app/core';
import { RedirectService } from 'app/businesslogic/redirect/redirect.service';

export class NumberAndOperation {
  n: number = null;
  o: string[1] = null;
}

export class FlashColumn {
  rows: number = null;
  n: number = null;
  ops: NumberAndOperation[] = [];
  result: number;
  type: number;
  digits: number;
  insertedResult: string[] = [];
  completeTime: number;
  completed = false;
  error = false;

  constructor(rows: number) {
    this.rows = rows;
    this.ops = [];
  }
}

export class ArabNumberInAbacus {
  columns: ArabDigitInAbacus[] = [];
}

export class ArabDigitInAbacus {
  s = 0;
  e = 0;
}

@Component({
  selector: 'jhi-kindergarten-detail',
  templateUrl: './gamecards.component.html'
})
export class GamecardsComponent implements OnInit {
  isSaving: boolean;
  isStarted = false;
  gamesList: IGame[];
  game: IGame;
  digits = 3;
  rows = 1;
  rowsIter: any;
  columns = 1;
  type = 1;
  max = 6;
  errors = 0;
  cells: FlashColumn[];
  originalCells: FlashColumn[];
  gameResult: IGameResult;
  gameStarted: Moment;
  gameEnded: Moment;
  typeFlag1 = false;
  typeFlag2 = false;
  typeFlag3 = false;
  typeFlag4 = false;

  isTraining = false;
  currentITrainingTeacher: ITrainingTeacher = null;
  winsRequired = 40;
  //winsRequired = 2;
  winsCount = 0;
  currentAccount: any;

  trainingColumns = [1, 2, 3, 4, 5, 6, 7];
  trainingTypes = [1, 2, 3, 4, 5, 6];
  //5 50+
  //6 100+
  trainingOperations = [1, 2];
  //1 +
  //2 -

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected jhiAlertService: JhiAlertService,
    protected dataUtils: JhiDataUtils,
    protected gameService: GameService,
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
        //.findNotCompletedForUserByTrainingId(1601)
        .findNotCompletedForUserByTrainingId(29)
        .pipe(
          filter((mayBeOk: HttpResponse<ITrainingTeacher[]>) => mayBeOk.ok),
          map((response: HttpResponse<ITrainingTeacher[]>) => response.body)
        )
        .subscribe(
          (res: ITrainingTeacher[]) => {
            res.forEach(t => {
              eval(t.training.conditions);
              log('ProcessingL: ' + t);
              this.isTraining = true;
              this.currentITrainingTeacher = t;
            });
          },
          (res: HttpErrorResponse) => this.onError(res.message)
        );
    });
    if (this.isTraining) {
      this.rows = 1;
    }
    this.rowsIter = Array(this.rows)
      .fill(0)
      .map((x, i) => i);

    this.prepareDataForSpecificFormat();
  }

  assignArabNumberToAbacus(number: number): ArabNumberInAbacus {
    let numberCopy = number;
    const arabNumberInAbacus: ArabNumberInAbacus = new ArabNumberInAbacus();
    while (numberCopy > 0) {
      const arabDigitInAbacus: ArabDigitInAbacus = new ArabDigitInAbacus();
      const lastDigit = numberCopy % 10;
      if (lastDigit >= 5) {
        arabDigitInAbacus.s = 1;
      } else {
        arabDigitInAbacus.s = 0;
      }
      arabDigitInAbacus.e = lastDigit % 5;
      arabNumberInAbacus.columns.push(arabDigitInAbacus);
      log('number: ' + numberCopy + ' abacusDigit.sky: ' + arabDigitInAbacus.s + ' abacusDigit.earth: ' + arabDigitInAbacus.e);
      numberCopy = Math.floor(numberCopy / 10);
    }
    arabNumberInAbacus.columns.push(new ArabDigitInAbacus());
    return arabNumberInAbacus;
  }

  assignAbacusToArabNumber(abacus: ArabNumberInAbacus): number {
    let number = 0;
    let digit = 1;
    // и тут с запасом зарядность на 1 больше
    for (let i = 0; i <= abacus.columns.length; i++) {
      if (abacus.columns[i]) {
        number = number + abacus.columns[i].e * digit + abacus.columns[i].s * digit * 5;
      }
      digit = digit * 10;
    }
    return number;
  }

  sumDigits(i: number, value1: ArabNumberInAbacus, value2: ArabNumberInAbacus, result: ArabNumberInAbacus): ArabDigitInAbacus {
    log('i:' + i);
    log('v1:' + value1);
    log('v2:' + value1);
    log('v1.c:' + value1.columns);
    log('v2.c:' + value2.columns);
    log('v1.length:' + value1.columns.length);
    log('v2.length:' + value2.columns.length);
    log('v1.value:' + value1.columns[i]);
    if (!value2.columns[i]) {
      value2.columns.push(new ArabDigitInAbacus());
    }
    log('v2.value:' + value2.columns[i]);
    log('>> Sum of ' + value1.columns[i].s + '.' + value1.columns[i].e + '; ' + value2.columns[i].s + '.' + value2.columns[i].e);
    if (1 - value1.columns[i].s >= value2.columns[i].s && 4 - value1.columns[i].e >= value2.columns[i].e) {
      log('Prosto');
      const e = value1.columns[i].e + value2.columns[i].e;
      const s = value1.columns[i].s + value2.columns[i].s;
      result.columns[i].e = e;
      result.columns[i].s = s;
    } else {
      // если не смогли войти в условие просто
      // брат
      // условия входа - можно сдвинуть небесную косточку вниз и вычесть брата числа на земной оси
      if (value1.columns[i].s === 0 && value2.columns[i].s === 0 && value1.columns[i].e >= 5 - value2.columns[i].e) {
        log('Brat');
        result.columns[i].s = 1;
        result.columns[i].e = value1.columns[i].e - (5 - value2.columns[i].e);
      } else {
        // если не смогли войти в условие брата
        // друг
        // условия входа - если можно вычесть друга из имеющегося числа (т.е. вычесть по небесной и земной оси число-друга)
        if (
          value1.columns[i].s >= 1 - value2.columns[i].s &&
          (value1.columns[i].e >= 5 - value2.columns[i].e || value2.columns[i].e === 0)
        ) {
          log('Drug');
          // result.columns[i+1].e++; // todo it be added through the recursive function
          const oneEarthToPlus = new ArabNumberInAbacus();
          oneEarthToPlus.columns = [];
          for (let j = 0; j < value1.columns.length + 2; j++) {
            oneEarthToPlus.columns.push(new ArabDigitInAbacus());
          }
          oneEarthToPlus.columns[i + 1].e = 1;
          this.sumDigits(i + 1, value1, oneEarthToPlus, value1);
          if (value2.columns[i].e !== 0) {
            result.columns[i].s = value1.columns[i].s - (1 - value2.columns[i].s);
            result.columns[i].e = value1.columns[i].e - (5 - value2.columns[i].e);
          } else {
            result.columns[i].s = 0;
            result.columns[i].e = value1.columns[i].e;
          }
        } else {
          // если не смогли войти в условие брата
          // друг + брат
          // условия входа по идее все остальные, так что не проверяем их ну или давайте проверим для самосогласованности
          // можно вычесть друга числа по правилу вычитания брата - небесная костяшка в положении выставлено, на земной есть место для добавления брата
          if (value1.columns[i].s === 1 && 4 - value1.columns[i].e >= value2.columns[i].e) {
            log('Drug+Brat');
            const oneEarthToPlus = new ArabNumberInAbacus();
            oneEarthToPlus.columns = [];
            for (let j = 0; j < value1.columns.length + 2; j++) {
              oneEarthToPlus.columns.push(new ArabDigitInAbacus());
            }
            oneEarthToPlus.columns[i + 1].e = 1;
            this.sumDigits(i + 1, value1, oneEarthToPlus, value1);
            // result.columns[i + 1].e++; // todo it be added through the recursive function
            result.columns[i].s = 0;
            result.columns[i].e = value1.columns[i].e + value2.columns[i].e;
          } else {
            log(
              'Something went wrong ' +
                value1.columns[i].s +
                '.' +
                value1.columns[i].e +
                '; ' +
                value2.columns[i].s +
                '.' +
                value2.columns[i].e
            );
          }
        }
      }
    }
    log('<< Sum of ' + value1.columns[i].s + '.' + value1.columns[i].e + '; ' + value2.columns[i].s + '.' + value2.columns[i].e);
    log('<< Result is ' + result.columns[i].s + '.' + result.columns[i].e);
    return result.columns[i];
  }

  sumDigitsFlagged(
    i: number,
    value1: ArabNumberInAbacus,
    value2: ArabNumberInAbacus,
    result: ArabNumberInAbacus,
    flagTypeString
  ): ArabDigitInAbacus {
    log('i:' + i);
    // log('v1:' + value1);
    // log('v2:' + value1);
    // log('v1.c:' + value1.columns);
    // log('v2.c:' + value2.columns);
    // log('v1.length:' + value1.columns.length);
    // log('v2.length:' + value2.columns.length);
    // log('v1.value:' + value1.columns[i]);
    if (!value2.columns[i]) {
      value2.columns.push(new ArabDigitInAbacus());
    }
    log('v2.value:' + value2.columns[i]);
    log('>> Sum of ' + value1.columns[i].s + '.' + value1.columns[i].e + '; ' + value2.columns[i].s + '.' + value2.columns[i].e);
    if (1 - value1.columns[i].s >= value2.columns[i].s && 4 - value1.columns[i].e >= value2.columns[i].e) {
      log('Prosto');
      this.typeFlag1 = true;
      const e = value1.columns[i].e + value2.columns[i].e;
      const s = value1.columns[i].s + value2.columns[i].s;
      result.columns[i].e = e;
      result.columns[i].s = s;
    } else {
      // если не смогли войти в условие просто
      // брат
      // условия входа - можно сдвинуть небесную косточку вниз и вычесть брата числа на земной оси
      if (value1.columns[i].s === 0 && value2.columns[i].s === 0 && value1.columns[i].e >= 5 - value2.columns[i].e) {
        log('Brat');
        this.typeFlag2 = true;
        result.columns[i].s = 1;
        result.columns[i].e = value1.columns[i].e - (5 - value2.columns[i].e);
      } else {
        // если не смогли войти в условие брата
        // друг
        // условия входа - если можно вычесть друга из имеющегося числа (т.е. вычесть по небесной и земной оси число-друга)
        if (
          value1.columns[i].s >= 1 - value2.columns[i].s &&
          (value1.columns[i].e >= 5 - value2.columns[i].e || value2.columns[i].e === 0)
        ) {
          log('Drug');
          this.typeFlag3 = true;
          // result.columns[i+1].e++; // todo it be added through the recursive function
          const oneEarthToPlus = new ArabNumberInAbacus();
          oneEarthToPlus.columns = [];
          for (let j = 0; j < value1.columns.length + 2; j++) {
            oneEarthToPlus.columns.push(new ArabDigitInAbacus());
          }
          oneEarthToPlus.columns[i + 1].e = 1;
          this.sumDigits(i + 1, value1, oneEarthToPlus, value1);
          if (value2.columns[i].e !== 0) {
            result.columns[i].s = value1.columns[i].s - (1 - value2.columns[i].s);
            result.columns[i].e = value1.columns[i].e - (5 - value2.columns[i].e);
          } else {
            result.columns[i].s = 0;
            result.columns[i].e = value1.columns[i].e;
          }
        } else {
          // если не смогли войти в условие брата
          // друг + брат
          // условия входа по идее все остальные, так что не проверяем их ну или давайте проверим для самосогласованности
          // можно вычесть друга числа по правилу вычитания брата - небесная костяшка в положении выставлено, на земной есть место для добавления брата
          if (value1.columns[i].s === 1 && 4 - value1.columns[i].e >= value2.columns[i].e) {
            log('Drug+Brat');
            this.typeFlag4 = true;
            const oneEarthToPlus = new ArabNumberInAbacus();
            oneEarthToPlus.columns = [];
            for (let j = 0; j < value1.columns.length + 2; j++) {
              oneEarthToPlus.columns.push(new ArabDigitInAbacus());
            }
            oneEarthToPlus.columns[i + 1].e = 1;
            this.sumDigits(i + 1, value1, oneEarthToPlus, value1);
            // result.columns[i + 1].e++; // todo it be added through the recursive function
            result.columns[i].s = 0;
            result.columns[i].e = value1.columns[i].e + value2.columns[i].e;
          } else {
            log(
              'Something went wrong ' +
                value1.columns[i].s +
                '.' +
                value1.columns[i].e +
                '; ' +
                value2.columns[i].s +
                '.' +
                value2.columns[i].e
            );
          }
        }
      }
    }
    log('<< Sum of ' + value1.columns[i].s + '.' + value1.columns[i].e + '; ' + value2.columns[i].s + '.' + value2.columns[i].e);
    log('<< Result is ' + result.columns[i].s + '.' + result.columns[i].e);
    return result.columns[i];
  }

  sum(value1: ArabNumberInAbacus, value2: ArabNumberInAbacus): ArabNumberInAbacus {
    const digitsNumber = Math.max(value1.columns.length, value2.columns.length);
    const result: ArabNumberInAbacus = new ArabNumberInAbacus();
    result.columns = [];
    for (let i = 0; i <= digitsNumber; i++) {
      // с запасом создадим разряд
      const digitInAbacus = new ArabDigitInAbacus();
      result.columns.push(digitInAbacus);
    }
    for (let i = 0; i < digitsNumber; i++) {
      this.sumDigitsFlagged(i, value1, value2, result, this.type);
    }
    return result;
  }

  classifySumPerDigit(digit1: number, digit2: number): number {
    if (digit1 + digit2 < 5) {
      return 0;
    }
    if (digit1 + digit2 - 5 < 5 && digit1 - 5 >= 0) {
      return 0;
    }
    if (digit1 + digit2 - 5 < 5 && digit2 - 5 >= 0) {
      return 0;
    }
    if (digit1 + digit2 >= 5 && digit1 < 5 && digit2 < 5) {
      return 1;
    }
    if (digit1 + digit2 === 5) {
      return 1;
    }
    if (digit1 + digit2 === 10) {
      return 2;
    }
    if (digit1 + digit2 >= 10 && digit1 + digit2 <= 15) {
      return 2;
    }
  }

  prepareDataForSpecificFormat() {
    this.rowsIter = Array(this.rows)
      .fill(0)
      .map((x, i) => i);
    log('lentgh' + this.rowsIter.length);
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

  handleGameColumnsSelection($event) {
    this.columns = +$event.target.value;
  }

  handleGameRowsSelection($event) {
    this.rows = +$event.target.value;
  }

  handleGameDigitsSelection($event) {
    this.digits = +$event.target.value;
  }

  handleGameTypeSelection($event) {
    log('Fromat selected: ' + $event.target.value);
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

  doCompare(cell: FlashColumn, resultValue: string): boolean {
    cell.insertedResult.push(resultValue);
    log('inserted:' + resultValue);
    const notFail = cell.result.toString().startsWith(resultValue);
    log('nofFail:' + notFail);
    if (notFail) {
      cell.error = false;
      log('resultValue.length:' + resultValue.length);
      log('cell.digits:' + cell.digits);
      if (resultValue.length >= cell.digits && cell.result + '' === resultValue) {
        cell.completed = true;
        const mom = new Date();
        cell.completeTime = mom.getTime();
        log('this particular is completed');
      }
      log('still not error');
    } else {
      log('error');
      cell.error = true;
      this.errors++;
    }
    if (
      this.cells.every((value, index, array): boolean => {
        log('completed' + value.completed);
        return value.completed;
      })
    ) {
      log('all are fine');
      this.gameEnded = moment(new Date());
      this.saveGameResult();
    }
    return notFail;
  }

  generateNumberCounterpart(type: number, counterpart: number): number {
    const counterpartAbacus = this.assignArabNumberToAbacus(counterpart);
    const generatedAbacus = new ArabNumberInAbacus();
    log('Counterpart lentgh: ' + counterpartAbacus.columns.length);
    // у нас лишний разряд в запасе, который работает прис ложении поэтому для вычисления числа перехода не  учитываем его
    for (let i = 0; i < counterpartAbacus.columns.length - 1; i++) {
      log('Processing i=th digit counterpart.s: ' + counterpartAbacus.columns[i].s);
      log('Processing i=th digit counterpart.e: ' + counterpartAbacus.columns[i].e);
      let s = 0;
      let e = 0;
      const digitNew = new ArabDigitInAbacus();
      if (type === 1) {
        s = Math.round(Math.random() * (1 - counterpartAbacus.columns[i].s));
        e = Math.round(Math.random() * (4 - counterpartAbacus.columns[i].e));
      }
      if (type === 2) {
        if (counterpartAbacus.columns[i].s === 0) {
          // условие, когда из цифры по правилу брата не перейти, выбор по просто
          s = Math.round(Math.random() * (1 - counterpartAbacus.columns[i].s));
          e = Math.round(Math.random() * (4 - counterpartAbacus.columns[i].e));
        } else {
          // вариант решения по правилу брата
          s = 0;
          e = Math.round(Math.random() * (4 - counterpartAbacus.columns[i].e) + counterpartAbacus.columns[i].e);
        }
      }
      if (type === 3) {
        const varyE = Math.round(Math.random() * counterpartAbacus.columns[i].e);
        const varyS = Math.round(Math.random() * counterpartAbacus.columns[i].s);
        if (varyE !== 0) {
          s = 1 - varyS;
          e = 5 - varyE;
        } else {
          s = 1;
          e = 0;
        }
      }
      if (type === 4) {
        if (counterpartAbacus.columns[i].s === 1) {
          // условие, когда из цифры по правилу брата+друг еще можно получить
          e = Math.round(Math.random() * (4 - counterpartAbacus.columns[i].e));
          s = 1;
        } else {
          // вариант решения по правилу друга только возможен
          const varyE = Math.round(Math.random() * counterpartAbacus.columns[i].e);
          const varyS = Math.round(Math.random() * counterpartAbacus.columns[i].s);
          if (varyE !== 0) {
            s = 1 - varyS;
            e = 5 - varyE;
          } else {
            s = 1;
            e = 0;
          }
        }
      }
      digitNew.s = s;
      digitNew.e = e;
      log('generation i: ' + i + ' .s:' + digitNew.s + ' .e:' + digitNew.e);
      generatedAbacus.columns.push(digitNew);
    }
    const toReturn = this.assignAbacusToArabNumber(generatedAbacus);
    log('Generated number: ' + toReturn);
    return toReturn;
  }

  generateNumber(digits: number, type: number): number {
    if (digits === 7) {
      return Math.floor(Math.random() * 8999999 + 1000000);
    }
    if (digits === 6) {
      return Math.floor(Math.random() * 899999 + 100000);
    }
    if (digits === 5) {
      return Math.floor(Math.random() * 89999 + 10000);
    }
    if (digits === 4) {
      return Math.floor(Math.random() * 8999 + 1000);
    }
    if (digits === 3) {
      return Math.floor(Math.random() * 899 + 100);
    }
    if (digits === 2) {
      return Math.floor(Math.random() * 89 + 10);
    }
    if (digits === 1) {
      return Math.floor(Math.random() * 8 + 1);
    }
  }

  checkFlagsAndCleanThemUp(): boolean {
    let toReturn = false;
    if (this.type === 1) {
      toReturn = this.typeFlag1 && !this.typeFlag2 && !this.typeFlag3 && !this.typeFlag4;
      if (toReturn) {
        log('Prosto detected');
      }
    }
    if (this.type === 2) {
      toReturn = this.typeFlag2 && !this.typeFlag3 && !this.typeFlag4;
      if (toReturn) {
        log('Brat detected');
      }
    }
    if (this.type === 3) {
      log('Drug detected');
      toReturn = this.typeFlag1 && !this.typeFlag4;
    }
    if (this.type === 4) {
      toReturn = this.typeFlag4;
      if (toReturn) {
        log('Drug+brat detected');
      } else {
        log('No drug+brat detected');
      }
    }
    log('typeFlag1' + this.typeFlag1);
    log('typeFlag2' + this.typeFlag2);
    log('typeFlag3' + this.typeFlag3);
    log('typeFlag4' + this.typeFlag4);
    log('toReturn' + toReturn);
    this.typeFlag1 = false;
    this.typeFlag2 = false;
    this.typeFlag3 = false;
    this.typeFlag4 = false;
    return toReturn;
  }

  createFlashColumn(): FlashColumn {
    const ATTEMPT_LIMIT = 10;
    const flashColumn = new FlashColumn(this.rows);
    let succsessFlag = false;
    while (!succsessFlag) {
      let number = this.generateNumber(this.digits, this.type);
      log('First number: ' + number);
      let sum = number;
      flashColumn.type = this.type;
      flashColumn.n = number;
      for (let i = 0; i < flashColumn.rows; i++) {
        log('Starting generation for row ' + i);
        let attemptCounter = 1;
        const n: NumberAndOperation = new NumberAndOperation();
        let sumAbacus2;
        while (!this.checkFlagsAndCleanThemUp() && attemptCounter < ATTEMPT_LIMIT) {
          log('Starting generation attempt number ' + attemptCounter + 'for row ' + i);
          attemptCounter++;
          n.n = this.generateNumberCounterpart(this.type, number);
          number = n.n;
          n.o = '+';
          const sumAbacus = this.assignArabNumberToAbacus(sum);
          const nAbacus = this.assignArabNumberToAbacus(n.n);
          sumAbacus2 = this.sum(sumAbacus, nAbacus);
        }
        if (attemptCounter < ATTEMPT_LIMIT) {
          succsessFlag = true;
        }
        sum = this.assignAbacusToArabNumber(sumAbacus2);
        log('sum for i = ' + i + ': ' + sum);
        flashColumn.ops.push(n);
      }
      flashColumn.result = sum;
      flashColumn.digits = this.digits;
      log('sum:' + sum);
    }
    return flashColumn;
  }

  generate() {
    this.cells = [];
    this.originalCells = [];
    for (let i = 0; i < this.columns; i++) {
      const flashColumn: FlashColumn = this.createFlashColumn();
      this.cells.push(flashColumn);
      this.originalCells.push(flashColumn);
    }
    this.gameStarted = moment(new Date());
    this.isStarted = true;
    this.prepareDataForSpecificFormat();
  }

  saveGameResult() {
    const duration = this.gameEnded.unix() - this.gameStarted.unix();
    this.gameResult.executionTimeSeconds = duration;
    this.gameResult.game = new Game();
    this.gameResult.game.id = 25;
    this.gameResult.gameFormat = 'FlashCardCol' + this.columns + 'Row' + this.rows + 'Dig' + this.digits + 'Type' + this.type;
    this.gameResult.endedTime = moment(new Date());
    this.gameResult.gameStartData = JSON.stringify(this.originalCells);
    this.gameResult.gameEndData = JSON.stringify(this.cells);
    this.gameResult.errorsCount = this.errors;
    this.subscribeToSaveResponse(this.gameResultService.createForUser(this.gameResult));
    this.gameResult = new GameResult();
    this.errors = 0;

    this.winsCount++;
    log('winsCount: ' + this.winsCount);
    log('winsRequired: ' + this.winsRequired);
    if (this.winsCount === this.winsRequired) {
      if (this.isTraining) {
        log('Sending result to server');
        this.currentITrainingTeacher.result = true;
        this.currentITrainingTeacher.exported = false;
        this.isTraining = false;
        this.subscribeToSaveResponseReload(this.trainingTeacherService.update(this.currentITrainingTeacher));
      }
    }
  }

  loadAll() {
    this.gameService
      .queryBusinesslogic()
      .pipe(
        filter((mayBeOk: HttpResponse<IGame[]>) => mayBeOk.ok),
        map((response: HttpResponse<IGame[]>) => response.body)
      )
      .subscribe((res: IGame[]) => (this.gamesList = res), (res: HttpErrorResponse) => this.onError(res.message));
  }

  colorForNumber(flashColumn: FlashColumn): object {
    let template = { 'background-color': '' };
    log(this.cells.indexOf(flashColumn) + '');
    switch (this.cells.indexOf(flashColumn)) {
      case 0: {
        template = { 'background-color': 'white' };
        break;
      }
      case 1: {
        template = { 'background-color': 'gray' };
        break;
      }
      case 2: {
        template = { 'background-color': 'blue' };
        break;
      }
      case 3: {
        template = { 'background-color': 'yellow' };
        break;
      }
      case 4: {
        template = { 'background-color': 'orange' };
        break;
      }
      case 5: {
        template = { 'background-color': 'violet' };
        break;
      }
      case 6: {
        template = { 'background-color': 'brown' };
        break;
      }
      case 7: {
        template = { 'background-color': 'green' };
        break;
      }
    }
    return template;
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IGameResult>>) {
    result.subscribe(() => this.onSaveSuccess(), () => this.onSaveError());
  }

  protected subscribeToSaveResponseReload(result: Observable<HttpResponse<ITrainingTeacher>>) {
    result.subscribe(() => this.onSaveSuccessReload(), () => this.onSaveError());
  }

  protected onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }

  protected onSaveSuccessReload() {
    this.isSaving = false;
    this.isStarted = false;
    this.redirectService.redirect(
      this.currentITrainingTeacher.training.subject.id,
      this.currentITrainingTeacher.training.identificator,
      this.currentITrainingTeacher.teacher.id
    );
  }

  protected onSaveSuccess() {
    this.isSaving = false;
    this.isStarted = false;
  }

  protected onSaveError() {
    this.isSaving = false;
    this.isStarted = false;
  }
}
