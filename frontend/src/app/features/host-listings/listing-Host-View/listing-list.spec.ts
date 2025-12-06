import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  ListingsList } from '../listing-Host-View/listing-list';

describe('ListingList', () => {
  let component: ListingsList;
  let fixture: ComponentFixture<ListingsList>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListingsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
