# Button Navigation Fix - Action Items

## Problem Identified
The three buttons (View, Edit, Delete) don't navigate because:

1. **getById() method** in listing.service.ts doesn't transform the API response
   - getPaged() transforms: `{result, errorMessage, isHaveErrorOrNo}` → `{data, totalCount, message, isError}`
   - getById() NEEDS the same transformation but doesn't have it

2. **Route navigation** in detail component has wrong order
   - Current: `['/listings', this.listing.id, 'edit']`
   - Should be: `['/listings', 'edit', this.listing.id]`

3. **Route navigation** in create-edit component has wrong order
   - Current: `['/listings', this.currentId, 'detail']`
   - Should be: `['/listings', 'detail', this.currentId]`

## Fixes to Apply

### Fix 1: Update listing.service.ts - getById() method (Line 30-32)
```typescript
// BEFORE:
getById(id: number): Observable<ListingsResponse<ListingDetailVM>> {
  return this.http.get<ListingsResponse<ListingDetailVM>>(`${this.apiUrl}/${id}`);
}

// AFTER:
getById(id: number): Observable<ListingsResponse<ListingDetailVM>> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    map(response => ({
      ...response,
      data: response.result || {},
      isError: response.isHaveErrorOrNo || false
    }))
  );
}
```

### Fix 2: Update listing.service.ts - delete() method (Line 47-49)
```typescript
// BEFORE:
delete(id: number): Observable<ListingsResponse<boolean>> {
  return this.http.delete<ListingsResponse<boolean>>(`${this.apiUrl}/${id}`);
}

// AFTER:
delete(id: number): Observable<ListingsResponse<boolean>> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
    map(response => ({
      ...response,
      isError: response.isHaveErrorOrNo || false
    }))
  );
}
```

### Fix 3: Update listing.service.ts - update() method (Line 43-46)
```typescript
// BEFORE:
update(id: number, vm: ListingUpdateVM): Observable<ListingsResponse<ListingDetailVM>> {
  const formData = this.buildFormData(vm);
  return this.http.put<ListingsResponse<ListingDetailVM>>(`${this.apiUrl}/${id}`, formData);
}

// AFTER:
update(id: number, vm: ListingUpdateVM): Observable<ListingsResponse<ListingDetailVM>> {
  const formData = this.buildFormData(vm);
  return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
    map(response => ({
      ...response,
      data: response.result || {},
      isError: response.isHaveErrorOrNo || false
    }))
  );
}
```

### Fix 4: Update listings-detail.ts - editListing() method (Line 53-56)
```typescript
// BEFORE:
editListing(): void {
  if (this.listing) {
    this.router.navigate(['/listings', this.listing.id, 'edit']);
  }
}

// AFTER:
editListing(): void {
  if (this.listing) {
    this.router.navigate(['/listings', 'edit', this.listing.id]);
  }
}
```

### Fix 5: Update listings-create-edit.ts - onSubmit() update success (Line 154-157)
```typescript
// BEFORE:
this.router.navigate(['/listings', this.currentId, 'detail']);

// AFTER:
this.router.navigate(['/listings', 'detail', this.currentId]);
```

### Fix 6: Update listings-create-edit.ts - onSubmit() create success (Line 174-177)
```typescript
// BEFORE:
this.router.navigate(['/listings', response.data, 'detail']);

// AFTER:
this.router.navigate(['/listings', 'detail', response.data]);
```

## Why This Fixes the Buttons

- **View button** → Navigates to `/listings/detail/:id` but detail component fails because `getById()` returns wrong format
- **Edit button** → Navigates to `/listings/edit/:id` with wrong route path  
- **Delete button** → Works but response format might be wrong

After these fixes, all three buttons will work properly and navigation will succeed.
