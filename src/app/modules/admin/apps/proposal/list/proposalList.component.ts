import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil, filter, switchMap } from 'rxjs/operators';
import { ProposalService } from '../proposals.service';
import { Proposal } from '../proposals.types';

@Component({
    selector: 'proposal-list',
    templateUrl: './proposalList.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalListComponent implements OnInit, OnDestroy {

    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

    vehicles$: Observable<Proposal[]>;

    vehiclesCount: number = 0;
    selectedVehicle: Proposal;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    drawerMode: 'side' | 'over';
    searchInputControl: FormControl = new FormControl();




    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private readonly ngxService: NgxUiLoaderService,
        private _proposalService: ProposalService,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {
    }
    ngOnInit(): void {
        this.vehicles$ = this._proposalService.proposals$;
        this._proposalService.proposals$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((proposal: Proposal[]) => {

                // Update the counts
                this.vehiclesCount = proposal.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the customer
        // this.customer$ = this._customersService.customer$;
        this._proposalService.proposal$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((vehicle: Proposal) => {
                // Update the counts
                console.log(321)
                this.selectedVehicle = vehicle;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.matDrawer.openedChange.subscribe((opened) => {
            if (!opened) {
                // Remove the selected customer when drawer closed
                this.selectedVehicle = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/') // '/'
                )
            )
            .subscribe(() => {
                this.newVehicle();
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {

                // Set the drawerMode if the given breakpoint is active
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                }
                else {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query =>

                    // Search
                    this._proposalService.searchVehicles(query)
                )
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
 
    newVehicle(): void {
        this.ngxService.start();
        this._proposalService.newVehicle().subscribe((newVehicle) => {

            this.ngxService.stop();
            this._router.navigate(['./', newVehicle.id], { relativeTo: this._activatedRoute });

            this._changeDetectorRef.markForCheck();

        });
    
        
    }

    onBackdropClicked(): void {
        // Go back to the list
        this._router.navigate(['./'], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}