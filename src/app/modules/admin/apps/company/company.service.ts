import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Company } from 'app/modules/admin/apps/company/company.types';
import { environment } from 'environments/environment';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Address } from 'cluster';
import { InventoryPagination } from '../product/product.types';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
    providedIn: 'root'
})
export class CustomersService {
    // Private
    private _company: BehaviorSubject<Company | null> = new BehaviorSubject(null);
    private _companies: BehaviorSubject<Company[] | null> = new BehaviorSubject(null);
    private _addresses:BehaviorSubject<Address[] | null>= new BehaviorSubject(null);
    private _approvals:BehaviorSubject<any[] | null>= new BehaviorSubject(null);
    private _totalSize: BehaviorSubject<number | null> = new BehaviorSubject(null);
    private _totalPage: BehaviorSubject<number | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<InventoryPagination | null> = new BehaviorSubject(null);
    private _statusCode: BehaviorSubject<any | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient,
        public toastr: ToastrManager,
        private translocoService: TranslocoService
    ) {
    }
    adresses = [];


    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for customer
     */
    get customer$(): Observable<Company> {
        return this._company.asObservable();
    }
    get pagination$(): Observable<InventoryPagination>
    {
        return this._pagination.asObservable();
    }
    get getTotalSize$(): Observable<any> {
        return this._totalSize;
    }
    
    get getTotalPage$(): Observable<any> {
        return this._totalPage;
    }

    /**
     * Getter for customers
     */
    get customers$(): Observable<Company[]> {
        return this._companies.asObservable();
    }

    get addresses$(): Observable<any[]> {
        return this._addresses.asObservable();
    }

    get approvals$(): Observable<any[]> {
        return this._approvals.asObservable();
    }
    get getStatusCode$(): Observable<any> {
        return this._statusCode;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get customers
     */
     getCustomers(page: number = 0, size: number = 5, sort: string = 'created_at', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
     Observable<any>{

        return this._httpClient.get<any>(`${environment.url}/company?page=${page}&size=${size}&sortBy=${sort}&sortType=${order}&filter=${search}`).pipe(
            tap((customers) => {
                this._companies.next(customers.body);
                this._pagination.next(customers.body);
                this._totalSize = customers.totalSize;
                this._totalPage = customers.totalPage;
            })
        );
    }

    getCountries():
    Observable<any> {
    let url = `${environment.url}/parameter/category/COUNTRIES`;
    return this._httpClient.get<any>(url);
    }   

    getTypes():
        Observable<any> {
        let url = `${environment.url}/parameter/category/COMPANY_TYPE`;
        return this._httpClient.get<any>(url);
    }
    getAddressByCompanyId(company_id: string): Observable<any> {
        return this._httpClient.get<any>(`${environment.url}/address/company/${company_id}`).pipe(
            tap((adresses) => {
                this._addresses.next(adresses.body)
            })
        )
    }

    getCompanyDocs():
        Observable<any> {
        let url = `${environment.url}/parameter/category/COMPANY_DOCS`;
        return this._httpClient.get<any>(url);
    }

    getCompanyApprovalStatus():
        Observable<any> {
        let url = `${environment.url}/parameter/category/COMPANY_APPROVAL_STATUS`;
        return this._httpClient.get<any>(url);
    }

    getApprovals(id:any): Observable<any>
    {
        return this._httpClient.get<any[]>(`${environment.url}/company-approval/approvals/${id}`).pipe(
            tap((response: any[]) => {
                this._approvals.next(response);
            })
        );
    }

    getValidateName(name:string):
    Observable<any> {
    let url = `${environment.url}/company/name-validate/`;
    return this._httpClient.get<any>(url+name).pipe(
        catchError((error)=>{
            if(error instanceof HttpErrorResponse && error.status == 602)
            {

            }
            return throwError(error);
        })
    )
    }

    /**
     * Search customers with given query
     *
     * @param query
     */
    searchCustomers(query: string): Observable<Company[]> {
        let filter = { card_name: query, card_code: query, email: query };
        let where = { filter, pageNumber: 9999, pageSize: 20, sortField: '', sortOrder: '' };

        return this._httpClient.post<any>(`${environment.url}/company/find`, { queryParams: where }).pipe(
            tap((customers) => {
                this._companies.next(customers.data);
            })
        );
    }

    /**
     * Get customer by id
     */
    getCustomerById(id: string): Observable<Company> {
        return this._companies.pipe(
            take(1),
            map((customers) => {
                const customer = customers.find(item => item.id === id) || null;
                this._company.next(customer);

                return customer;
            }),
            switchMap((customer) => {

                if (!customer) {
                    return throwError('Could not found customer with id of ' + id + '!');
                }

                return of(customer);
            })
        );
    }

    getCompanyById(id: string): Observable<any> {
        return this._httpClient.get<any>(`${environment.url}/company/${id}`)
    }
   

    createAddress(address: any): Observable<any>
    {
        
        let url = `${environment.url}/address/`;
        
        if(address.id === '' || address.id === null){
            delete address.id;
            return this.addresses$.pipe(
                take(1),
                switchMap(addresses => this._httpClient.post<any>(url, address).pipe(
                    map((newAddress) => {
    
                        this.toastr.successToastr(this.translocoService.translate('message.addressAdded'));
    
                        return newAddress;
                    })
                ))
            );
        }else{
            return  this._httpClient.put<any>(url+address.id, address);
    
        }
    }

    createApproval(approval: any): Observable<any>
    {
        return this.approvals$.pipe(
            take(1),
            switchMap(approvals => this._httpClient.post<any>(`${environment.url}/company-approval`, approval).pipe(
                map((newApproval) => {
                    return newApproval;
                })
            ))
        );
    }

    deleteAddress(address: any): Observable<any>
    {
        let url = `${environment.url}/address/delete/`;
        return this.addresses$.pipe(
            take(1),
            switchMap(addresses => this._httpClient.put<any>(url+address.id, address).pipe(
                map((newAddress) => {

                    this.toastr.successToastr(this.translocoService.translate('message.deleteAddress'));

                    return newAddress;
                })
            ))
        );
    }

    deleteDocs(doc: any): Observable<any>
    {
        let url = `${environment.url}/media/delete/`;
        return this._httpClient.put<any>(url+doc.id, doc).pipe(
            map((newDoc) => {
                this.toastr.successToastr(this.translocoService.translate('message.deleteMedia'));
                return newDoc
            })
        )
    }

    /**
     * Create customer
     */
    createCustomer(item: any): Observable<any> {
        if (item.id) {
            return this.customers$.pipe(
                take(1),
                switchMap(customers => this._httpClient.put<any>(`${environment.url}/company/${item.id}`, item).pipe(
                    map((newCustomer) => {
                        this.toastr.successToastr(this.translocoService.translate('message.updateCompany'));

                        return newCustomer.body;
                    })
                ))
            );
        }
        else {
            return this.customers$.pipe(
                take(1),
                switchMap(customers => this._httpClient.post<any>(`${environment.url}/company/`, item).pipe(
                    map((newCustomer) => {
                        this.toastr.successToastr(this.translocoService.translate('message.createCompany'));

                        return newCustomer.body;
                    })
                ))
            );
        }
    }

    /**
     * Update customer
     *
     * @param id
     * @param customer
     */
    updateCustomer(id: string, customer: Company): Observable<any> {
        return this.customers$.pipe(
            take(1),
            switchMap(customers => this._httpClient.put<any>(`${environment.url}/company/${id}`, customer).pipe(
                map((updatedCustomer) => {
                    const index = customers.findIndex(item => item.id === id);
                    customers[index] = updatedCustomer.body;
                    this._companies.next(customers);

                    return updatedCustomer.body;
                }),
                switchMap(updatedCustomer => this.customer$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the customer if it's selected
                        this._company.next(updatedCustomer);

                        // Return the updated customer
                        return updatedCustomer;
                    })
                ))
            ))
        );
    }

    /**
     * Delete the customer
     *
     * @param company_id
     */
    deleteCompany(company_id: string): Observable<boolean> {
        return this.customers$.pipe(
            take(1),
            switchMap(customers => this._httpClient.put(`${environment.url}/company/delete/${company_id}`, { company_id }).pipe(
                map((isDeleted: any) => {
                    if (isDeleted.success) {
                        // Find the index of the deleted customer
                        const index = customers.findIndex(item => item.id === company_id);

                        // Delete the customer
                        customers.splice(index, 1);

                        // Update the customers
                        this._companies.next(customers);

                        // Return the deleted status
                    }
                    else
                    {
                        this.toastr.warningToastr(this.translocoService.translate('message.deleteCompany'));
                    }
                    return isDeleted;
                })
            )),
            catchError((error)=>{
                if(error instanceof HttpErrorResponse && error.status == 601)
                {
                    this.toastr.errorToastr(this.translocoService.translate('message.error.601'));
                }
                return throwError(error);
            })
        );
    }

    uploadAvatar(id: string, avatar: File): Observable<Company> {
        const formData = new FormData();
        let headers = new Headers();

        headers.append('Content-Type', 'multipart/form-data');
        headers.append('Accept', 'application/json');
        formData.append("file", avatar);
        let tmp = {};
        return this._httpClient.post<any>(
            `${environment.url}/users/avatar/`, formData);
    }


    uploadMedia(file: File,company_id?: string,user_id?: string,title?: string, description?:string, type?:string,
                                        video_url?:string, ref?: string, ref_id?:string): Observable<Company> {
        const formData = new FormData();
        let headers = new Headers();
        headers.append('Content-Type', 'multipart/form-data');
        headers.append('Accept', 'application/json');
        formData.append("file", file);
        formData.append("company_id", company_id);
        formData.append("user_id", user_id);
        formData.append("title", title);
        formData.append("description", description); 
        formData.append("type", type); 
        formData.append("video_url", video_url); 
        formData.append("ref", ref); 
        formData.append("ref_id", ref_id); 
        

/*
        let tmp = {
            company_id: company_id,
            user_id :user_id,
            title : title,
            file: file,
            description: description,
            type:type,
            video_url:video_url,
            ref: ref,
            ref_id: ref_id
        };
        */
        return this._httpClient.post<any>(
            `${environment.url}/media/upload`, formData);
    }
}
