import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProposalService } from '../proposals.service';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AuthService } from 'app/core/auth/auth.service';
import { GeneralFunction } from 'app/shared/GeneralFunction';
import { ToastrManager } from 'ng6-toastr-notifications';
import { TranslocoService } from '@ngneat/transloco';
@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent implements OnInit {

  public generalFunction = new GeneralFunction();
  offerForm: FormGroup;

  dataSourceCurrencyTypes: any[];
  dataSourcePaymentTypes: any[];

  isAdmin:boolean=false;

  currency = "$";
  usAmount = 100;
  updateUSAmount(event) {
    this.usAmount = event.target.value;
  }
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _proposalService: ProposalService,
    public toastr: ToastrManager,
    private translocoService: TranslocoService,
    private _authService: AuthService,
    public dialogRef: MatDialogRef<OfferComponent>,
    private _formBuilder: FormBuilder) {

    this._proposalService.getPaymentTypes().subscribe(res => {
      this.dataSourcePaymentTypes = res.body;
    });

    this._proposalService.getCurrency().subscribe(res => {
      this.dataSourceCurrencyTypes = res.body;
    });
     }

  ngOnInit(): void {
    this.offerForm = this._formBuilder.group({
      proposal_id: this.data.id,
      company_id: [this._authService.CompanyId],
      offer_date: ['', Validators.required],
      payment_type: ['', Validators.required],
      price: ['', Validators.required],
      id: [''],
      currency:['', Validators.required],
      deal_status:['NOT OK', Validators.required],
    });
    let tmp = JSON.parse(localStorage.getItem('user'));
    if (tmp.role == "admin") {
      this.isAdmin = true;
    }
    else {
      this.isAdmin = false;
    }
  }

  selectedCurrency(value)
  {
    this.currency=value;
  }

  saveOffer(){
    let status = this.generalFunction.formValidationCheck(this.offerForm,this.toastr,this.translocoService);
    if(status)
    {
      return
    }
    this._proposalService.createProposalOffer(this.offerForm.value).subscribe(data=>{
      this.dialogRef.close()
  });
  }

  closeDialog(){
    this.dialogRef.close()
  }
}
