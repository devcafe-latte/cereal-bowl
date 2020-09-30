import { Moment } from 'moment';

import { ObjectMapping, Serializer } from '../util/Serializer';
import moment from 'moment';

export class Book {
  id?: number = null;
  authorId: number = null;
  author: Author = null;
  title: string = null;
  subtitle?: string = null;
  isbn: string = null;
  released: Moment = null;
  isGood: boolean = null;

  static deserialize(data: any): Book {
    const m: ObjectMapping = {
      released: 'moment',
    }

    return Serializer.deserialize(Book, data, m);
  }

  static randomBook(): Book {
    const b = new Book();
    b.authorId = 1;
    b.title = randomText(5);
    b.subtitle = randomText(8);
    b.released = randomDate();
    b.isGood = randomBool()
    b.isbn = String(randomNumber(100000000, 9999999999));

    return b;
  }
}

export class Author {
  id?: number = null;
  name: string = null;
  birthday?: Moment = null;
  active: boolean = null;

  static deserialize(data: any): Author {
    const m: ObjectMapping = {
      birthday: 'moment',
    }

    return Serializer.deserialize(Author, data, m);
  }

  static randomAuthor(): Author {
    const a = new Author();
  
    a.name = randomText(2);
    a.active = randomBool();
    a.birthday = randomDate();

    return a;
  }
}

function randomNumber(minOrMax: number, max?: number): number {
  let min = 0;
  if (max) {
    min = minOrMax
  } else {
    max = minOrMax;
  }
  const diff = max - min;

  return Math.floor((Math.random() * diff) + min);
}

function randomText(wordCount: number) {
  const words = ipsum.split(' ');

  let text = [];
  let currentIndex = randomNumber(words.length);

  for (let i = 0; i < wordCount; i++) {
    text.push(words[currentIndex % words.length]);
    currentIndex++;
  }

  return text.join(" ");
}

function randomBool(): boolean {
  return randomNumber(1) === 0;
}

function randomDate(): Moment {
  return moment()
    .startOf('day')
    .set('month', randomNumber(1, 12))
    .set('day', randomNumber(1, 28));
}

const ipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent in viverra orci. Donec congue, leo non iaculis fringilla, erat eros dictum nisl, non rhoncus nibh mi sed dui. Integer ultrices odio euismod, venenatis sem sit amet, pretium nunc. In eu elementum nibh. Donec justo ex, posuere vel porta porta, condimentum ut libero. Etiam lacinia egestas varius. Phasellus vulputate auctor leo. Sed efficitur augue mollis viverra pretium. Vestibulum quis augue vel elit placerat luctus eget eget elit. Duis ut arcu mi. Phasellus ultrices urna ex. Proin sed lectus leo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam ullamcorper vestibulum purus sed volutpat. Ut nec libero nibh. Morbi finibus euismod ante et mattis. Quisque egestas sapien in ligula congue vulputate. Fusce sed dui ut arcu finibus varius eleifend vel purus. Mauris velit dui, suscipit vel dignissim eget, eleifend a justo. Donec cursus finibus ex, id condimentum risus. Nunc ut tortor eget nulla placerat bibendum nec ut nibh. Ut et lorem lacinia, consectetur augue vitae, malesuada tortor. Curabitur tincidunt eu neque eget faucibus. Donec tempor dolor non tortor rutrum vestibulum. Integer varius, velit facilisis malesuada dapibus, turpis dolor finibus arcu, eu facilisis velit augue id risus. Suspendisse tempus ac sem non pretium. Cras dapibus feugiat eros, sed elementum ex pellentesque et. Nam fermentum convallis massa non fringilla. Donec elementum hendrerit cursus. Nulla faucibus rhoncus vestibulum. Vivamus iaculis tincidunt tincidunt. Donec aliquet tortor dui, vitae gravida purus efficitur at. Maecenas gravida ligula eget ligula malesuada cursus. Cras lacinia eleifend tincidunt. Nullam vel pellentesque nunc, ac porta ante. Integer vitae scelerisque est, vitae pulvinar purus. Vestibulum eleifend tincidunt turpis, vulputate consectetur neque. Quisque sit amet nulla nulla. Phasellus pulvinar purus eu blandit fermentum. Nunc eget ante in lacus faucibus rutrum. Phasellus sed laoreet metus, nec tincidunt mi. Donec sollicitudin.";