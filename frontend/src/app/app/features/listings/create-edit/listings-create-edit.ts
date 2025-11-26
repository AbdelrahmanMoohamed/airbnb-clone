import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-listings-create-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listings-create-edit.html',
  styleUrls: ['./listings-create-edit.css']
})
export class ListingsCreateEdit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  imagePreview: string | null = null;

  form = this.fb.group({
    title: ['', Validators.required],
    location: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(1)]],
    guests: [null, [Validators.required, Validators.min(1)]],
    description: [''],
    amenities: this.fb.control<string[]>([]),
    imageUrl: [null as string | null]
  });

  isEdit = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
  }
  onImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      this.imagePreview = url;
      this.form.patchValue({ imageUrl: url });
    };
    reader.readAsDataURL(file);
  }

  onAmenityAdd(input: HTMLInputElement) {
    const value = input.value.trim();
    if (!value) return;

    const arr = this.form.value.amenities ?? [];
    arr.push(value);

    this.form.patchValue({ amenities: arr });

    input.value = '';
  }

  removeAmenity(index: number) {
    const arr = [...(this.form.value.amenities ?? [])];
    arr.splice(index, 1);
    this.form.patchValue({ amenities: arr });
  }

  onSubmit() {
    if (this.form.invalid) return;

    console.log(this.form.value);

    this.router.navigate(['/listings']);
  }
}
