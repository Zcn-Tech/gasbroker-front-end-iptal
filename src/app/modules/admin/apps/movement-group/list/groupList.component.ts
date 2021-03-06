import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { ToastrManager } from 'ng6-toastr-notifications';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { merge, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { ConfirmationDialog } from '../../delete-dialog/delete.component';
import { InventoryPagination } from '../../product/product.types';
import { GroupService } from '../group.service';
import { Group } from '../group.types';

@Component({
    selector       : 'group-list',
    templateUrl    : './groupList.component.html',
    styleUrls: ['./groupList.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupListComponent implements OnInit
{
    dialogRef: MatDialogRef<ConfirmationDialog>;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    groupCount: number = 0;
    groups$:Observable<Group[]>
    drawerMode: 'side' | 'over';
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    groupTableColumns: string[] = ['description','detail'];
    selectedGroup:any;
    pagination: InventoryPagination;
    isLoading: boolean = false;
    totalSize$: Observable<any>;
    totalPage$: Observable<any>;
    public currentPage = 1;
    public pageSize = 10;
    public filter: string;

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _groupService: GroupService,
        public toastr: ToastrManager,
        private translocoService: TranslocoService,
        private dialog: MatDialog,
        private readonly ngxService: NgxUiLoaderService,

    )
    {
        this.onLoad();
    }

    ngOnInit(): void{
        this.ngxService.start();
        this._groupService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: InventoryPagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this.groups$ = this._groupService.groups$;
        this.totalSize$ = this._groupService.getTotalSize$;
        this.totalPage$ = this._groupService.getTotalPage$;
        this._groupService.groups$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((groups: Group[]) => {

                this.groupCount = groups?.length;
                
                this._changeDetectorRef.markForCheck();
            });
        this._groupService.group$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((group: Group) => {
                // Update the counts
                this.selectedGroup = group;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    this.ngxService.stop();
    }
    ngAfterViewInit(): void {
        // If the user changes the sort order...
        this._sort.sortChange
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
            });
        // Get products if sort or page changes
        merge(this._sort.sortChange,).pipe(
            switchMap(() => {
                this.isLoading = true;
                return this._groupService.getGroup();
            }),
            map(() => {
                this.isLoading = false;
            })
        ).subscribe();
    }

    onLoad() {
        this._groupService.getGroup().subscribe();
    }

    newGroup(){
        this._router.navigate(['/apps/group/form']);
    }

    deleteGroup(item :any){
        this.dialogRef = this.dialog.open(ConfirmationDialog, {
            disableClose: false
          });
          this.dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.ngxService.start();
                this._groupService.deleteGroup(item).subscribe(data=>{
                    this._router.navigateByUrl('/apps/group/list');
                    this._groupService.getGroup().subscribe();
                    this.toastr.errorToastr(this.translocoService.translate('message.deleteProcessGroup'));
                });
            this.ngxService.stop();
            }                
            this.dialogRef = null;
          });
    }
    openGroup(item:any)
    {
        this._router.navigate(['/apps/group/form/'+item.id]);
    }

    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    public setStyle(it: number): string {
        if ((it % 2) === 0) {
            return 'zebra';
        } else {
            return '';
        }
    }

    getServerData(event?: PageEvent) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this._groupService.getGroup(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.filter ).subscribe();


    }
    public applyFilter(filterValue: string) {
        this.filter = filterValue;
        this._groupService.getGroup(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, filterValue).subscribe();

    }
}
