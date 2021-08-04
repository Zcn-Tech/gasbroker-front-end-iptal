import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProposalService } from '../proposals.service';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AuthService } from 'app/core/auth/auth.service';
@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent implements OnInit {


  offerForm: FormGroup;

  dataSourceCurrencyTypes: any[];
  dataSourcePaymentTypes: any[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _proposalService: ProposalService,
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
      deal_status:['', Validators.required],
      currency:['', Validators.required],
    });
  }

  saveOffer(){
    this._proposalService.createProposalOffer(this.offerForm.value).subscribe(data=>{
      this.dialogRef.close()
  });
  }

  closeDialog(){
    this.dialogRef.close()
  }
}
