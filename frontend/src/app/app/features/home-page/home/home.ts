import { Component } from '@angular/core';
import { HeroCard } from "../hero-card/hero-card";
import { ListingCard } from "../listing-card/listing-card";

@Component({
  selector: 'app-home',
  imports: [HeroCard, ListingCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
