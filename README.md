# Angular2 Subscriber Component Decorators

A set of decorators that reduce the boilerplate of unsubscribing from rxJS Subscriptions in your components.

## The API

This library requires that your component implements `OnInit`.

The available Decorators are:

### @Subscriber
The component decorator for setting up the onInit and OnDestroy hooks.

### @MethodSubscription
A class method decorator that adds a subscription or array of subscriptions to the internal list to be torn down on destroy. The return value of the method must be an Array or Subscription.

### @PropertySubscription
A class property decorator. To be used seldomly since it starts the subscription when the component is instantiated instead of ngOnInit. This is not ideal, but possibly useful. The subscription still gets unsubscribed in ngOnDestroy properly.

### @Unsubscribe
A class method property decorator that triggers the unsubscribe logic on the decorated method. Note: Currently, the ngOnDestroy hook will do the unsubscribe logic regardless of there being a method decorated with @Unsubscribe. This could change in a future version.

## Example

```
import { Component, OnInit } from '@angular/core';
import { SessionService } from '../session-service/session.service';
import { Subscriber, Unsubscribe, MethodSubscription, PropertySubscription } from 'angular2-subscriber-component-decorators';

@Subscriber({})
@Component({
  moduleId: module.id,
  selector: 'app-sessions-page',
  templateUrl: 'sessions-page.component.html',
  styleUrls: ['sessions-page.component.css'],
  providers: [SessionService]
})
export class SessionsPageComponent implements OnInit {

  sessions: Session[] = [];

  @MethodSubscription({})
  sessionSubscription() {
    return this.sessionService.getSessions().subscribe(
      (sessions) => { this.sessions = sessions; console.log('Sessions: ', sessions); },
      (error) => { console.error(<any>error); }
    );
  }

  constructor(private sessionService: SessionService) { }

  ngOnInit() {
    // An example of manually adding a subscription to the list to be unsubscribed later. Notice that we have to use the array syntax since the linter is unable to traverse the decorators far enough to see the subs property.
    // this['subs'].push(
    //   this.sessionService.getSessions()
    //     .subscribe(
    //       (sessions) => { this.sessions = sessions; console.log('Sessions: ', sessions); },
    //       (error) => { console.error(<any>error); }
    //     )
    // );
  }

  ngOnDestroy() {
  }

}


```