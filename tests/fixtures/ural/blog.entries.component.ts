import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { DATE_TIME_FORMAT } from 'app/shared/constants/input.constants';
import { IBlogEntry, BlogEntry } from 'app/shared/model/blog-entry.model';
import { IUser, UserService } from 'app/core';

import 'froala-editor/js/plugins/fullscreen.min.js';
import 'froala-editor/js/plugins/file.min.js';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';

import { BlogEntryService } from 'app/entities/blog-entry/blog-entry.service';

import { JhiEventManager, JhiParseLinks, JhiAlertService, JhiDataUtils } from 'ng-jhipster';
import { AccountService } from 'app/core';
import { Subscription } from 'rxjs';
import { ITEMS_PER_PAGE } from 'app/shared';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'jhi-blog-entry',
  templateUrl: './blog.entries.html'
})
export class BlogEntriesComponent implements OnInit {
  public editorContent: Object = {};

  public options: Object = {
    placeholderText: 'Edit Your Content Here!',
    charCounterCount: true,
    // imageInsertButtons: ['uploadImage'],
    // fileInsertButtons: ['uploadFile'],
    // imageUploadParam: 'image_param',
    // fileUploadParam: 'file_param',
    // fileUploadURL: '/upload_file',
    // Additional upload params.
    imageUploadParams: { id: 'my_editor_image' },
    fileUploadParams: { id: 'my_editor' },
    // Set max image size to 5MB.
    imageMaxSize: 5 * 1024 * 1024,
    fileMaxSize: 5 * 1024 * 1024,
    // Allow to upload PNG and JPG.
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'tiff'],
    fileAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'tiff'],
    // toolbarButtons: ['fontFamily', '|', 'fontSize', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', 'undo', 'redo', 'codeView'],
    fontFamilySelection: true,
    fontSizeSelection: true,
    paragraphFormatSelection: true,
    paragraphFormat: {
      N: 'Normal',
      H1: 'Heading 1',
      H2: 'Heading 2'
    },
    buttons: [
      'fullscreen',
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
      'fontFamily',
      'fontSize',
      'color',
      'emoticons',
      'inlineStyle',
      'paragraphStyle',
      'paragraphFormat',
      'align',
      'formatOL',
      'formatUL',
      'outdent',
      'uploadFile'
    ],
    events: {
      'image.beforeUpload': function(files) {
        console.log('Start');
        const editor = this;
        if (files.length) {
          // Create a File Reader.
          const reader = new FileReader();
          reader.onload = e => {
            var result = reader.result;
            editor.image.insert(result, null, null, editor.image.get());
          };
          // Read image as base64.
          reader.readAsDataURL(files[0]);
        }
        //editor.popups.hideAll();
        // Stop default upload chain.
        return false;
      },
      'file.beforeUpload': function(files) {
        const editor = this;
        if (files.length) {
          // Create a File Reader.
          const reader = new FileReader();
          reader.onload = e => {
            var result = reader.result;
            editor.image.insert(result, null, null, editor.image.get());
          };
          // Read image as base64.
          reader.readAsDataURL(files[0]);
        }
        //editor.popups.hideAll();
        // Stop default upload chain.
        return false;
      }
      // 'froalaEditor.image.inserted': function ($img, response) {
      //  // Image was inserted in the editor.
      // }
    }
  };

  isSaving: boolean;

  public users: IUser[];

  editForm = this.fb.group({
    id: [],
    title: [null, [Validators.required]],
    text: [null, [Validators.required]],
    created: [],
    deleted: [],
    visible: [],
    author: []
  });
  blogEntries: IBlogEntry[];
  currentAccount: any;
  eventSubscriber: Subscription;
  itemsPerPage: number;
  links: any;
  page: any;
  predicate: any;
  reverse: any;
  totalItems: number;
  currentSearch: string;
  criteria = { 'visible.equals': 'true' };

  constructor(
    protected dataUtils: JhiDataUtils,
    protected jhiAlertService: JhiAlertService,
    protected blogEntryService: BlogEntryService,
    protected userService: UserService,
    protected activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    protected eventManager: JhiEventManager,
    protected parseLinks: JhiParseLinks,
    protected accountService: AccountService
  ) {
    this.blogEntries = [];
    this.itemsPerPage = ITEMS_PER_PAGE;
    this.page = 0;
    this.links = {
      last: 0
    };
    this.predicate = 'id';
    this.reverse = true;
    this.currentSearch =
      this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search'] ? this.activatedRoute.snapshot.params['search'] : '';
  }

  ngOnInit() {
    this.isSaving = false;
    this.activatedRoute.data.subscribe(({ blogEntry }) => {
      this.updateForm(blogEntry);
    });
    this.userService
      .query()
      .pipe(
        filter((mayBeOk: HttpResponse<IUser[]>) => mayBeOk.ok),
        map((response: HttpResponse<IUser[]>) => response.body)
      )
      .subscribe((res: IUser[]) => (this.users = res), (res: HttpErrorResponse) => this.onError(res.message));
    this.blogEntries = [];
    this.itemsPerPage = ITEMS_PER_PAGE;
    this.page = 0;
    this.links = {
      last: 0
    };
    this.predicate = 'id';
    this.reverse = true;
    this.currentSearch =
      this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search'] ? this.activatedRoute.snapshot.params['search'] : '';
    this.loadAll();
    this.accountService.identity().then(account => {
      this.currentAccount = account;
    });
    this.registerChangeInBlogEntries();
  }

  updateForm(blogEntry: IBlogEntry) {
    this.editForm.patchValue({
      id: blogEntry.id,
      title: blogEntry.title,
      text: blogEntry.text,
      created: blogEntry.created != null ? blogEntry.created.format(DATE_TIME_FORMAT) : null,
      deleted: blogEntry.deleted != null ? blogEntry.deleted.format(DATE_TIME_FORMAT) : null,
      visible: blogEntry.visible,
      author: blogEntry.author
    });
  }

  byteSize(field) {
    return this.dataUtils.byteSize(field);
  }

  openFile(contentType, field) {
    return this.dataUtils.openFile(contentType, field);
  }

  setFileData(event, field: string, isImage) {
    return new Promise((resolve, reject) => {
      if (event && event.target && event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (isImage && !/^image\//.test(file.type)) {
          reject(`File was expected to be an image but was found to be ${file.type}`);
        } else {
          const filedContentType: string = field + 'ContentType';
          this.dataUtils.toBase64(file, base64Data => {
            this.editForm.patchValue({
              [field]: base64Data,
              [filedContentType]: file.type
            });
          });
        }
      } else {
        reject(`Base64 data was not set as file could not be extracted from passed parameter: ${event}`);
      }
    }).then(
      () => console.log('blob added'), // sucess
      this.onError
    );
  }

  previousState() {
    window.history.back();
  }

  save() {
    this.isSaving = true;
    const blogEntry = this.createFromForm();
    blogEntry.author = this.users[0];
    blogEntry.created = moment();
    this.subscribeToSaveResponse(this.blogEntryService.create(blogEntry));
  }

  private createFromForm(): IBlogEntry {
    return {
      ...new BlogEntry(),
      id: this.editForm.get(['id']).value,
      text: this.editForm.get(['text']).value,
      title: this.editForm.get(['title']).value,
      created: this.editForm.get(['created']).value != null ? moment(this.editForm.get(['created']).value, DATE_TIME_FORMAT) : undefined,
      deleted: this.editForm.get(['deleted']).value != null ? moment(this.editForm.get(['deleted']).value, DATE_TIME_FORMAT) : undefined,
      visible: this.editForm.get(['visible']).value,
      author: this.editForm.get(['author']).value
    };
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IBlogEntry>>) {
    result.subscribe(() => this.onSaveSuccess(), () => this.onSaveError());
  }

  protected onSaveSuccess() {
    this.isSaving = false;
    //this.previousState();
    window.location.reload();
    //this.loadPage(this.page);
  }

  protected onSaveError() {
    this.isSaving = false;
    this.jhiAlertService.error('Blog entry creation problem!', null, null);
  }

  trackUserById(index: number, item: IUser) {
    return item.id;
  }

  loadAll() {
    if (this.currentSearch) {
      this.blogEntryService
        .search({
          query: this.currentSearch,
          page: this.page,
          size: this.itemsPerPage,
          sort: this.sort()
        })
        .subscribe(
          (res: HttpResponse<IBlogEntry[]>) => this.paginateBlogEntries(res.body, res.headers),
          (res: HttpErrorResponse) => this.onError(res.message)
        );
      return;
    }

    this.blogEntryService
      .query({
        page: this.page,
        size: this.itemsPerPage,
        sort: this.sort(),
        'visible.equals': 'true'
      })
      .subscribe(
        (res: HttpResponse<IBlogEntry[]>) => this.paginateBlogEntries(res.body, res.headers),
        (res: HttpErrorResponse) => this.onError(res.message)
      );
  }

  reset() {
    this.page = 0;
    this.blogEntries = [];
    this.loadAll();
  }

  loadPage(page) {
    this.page = page;
    this.loadAll();
  }

  clear() {
    this.blogEntries = [];
    this.links = {
      last: 0
    };
    this.page = 0;
    this.predicate = 'id';
    this.reverse = true;
    this.currentSearch = '';
    this.loadAll();
  }

  search(query) {
    if (!query) {
      return this.clear();
    }
    this.blogEntries = [];
    this.links = {
      last: 0
    };
    this.page = 0;
    this.predicate = '_score';
    this.reverse = false;
    this.currentSearch = query;
    this.loadAll();
  }

  ngOnDestroy() {
    this.eventManager.destroy(this.eventSubscriber);
  }

  trackId(index: number, item: IBlogEntry) {
    return item.id;
  }

  registerChangeInBlogEntries() {
    this.eventSubscriber = this.eventManager.subscribe('blogEntryListModification', response => this.reset());
  }

  sort() {
    const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
    if (this.predicate !== 'id') {
      result.push('id');
    }
    return result;
  }

  protected paginateBlogEntries(data: IBlogEntry[], headers: HttpHeaders) {
    this.links = this.parseLinks.parse(headers.get('link'));
    this.totalItems = parseInt(headers.get('X-Total-Count'), 10);
    for (let i = 0; i < data.length; i++) {
      this.blogEntries.push(data[i]);
    }
  }

  protected onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }
}
