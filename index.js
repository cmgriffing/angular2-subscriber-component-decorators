import { Subscription } from 'rxjs/Subscription';

// Private Helper Methods
const setupSubscriberMethods = function(target) {
  if(!target.subscriberMethods) {
    target.subscriberMethods = [];
  }
}

// Public Decorators
export function Subscriber(params) {
  return function (target) {

    if(!target.prototype.ngOnInit || !target.prototype.ngOnDestroy) {
      console.warn("@Subscriber only works on components that implement the OnInit trait.");
      return;
    }

    target.prototype.subs = [];
    setupSubscriberMethods(target);

    // update ngOnInit to actually fire our method subscribers
    const originalInit = target.prototype.ngOnInit;
    target.prototype.ngOnInit = function() {
      target.prototype.subscriberMethods.map((method) => {
        method.apply(this);
      })
      originalInit.apply(this);
    };

    const originalOnDestroy = target.prototype.ngOnDestroy;
    target.prototype.ngOnDestroy = function() {
      this.subs.map(function(sub) {
        console.log('unsubscribing');
        sub.unsubscribe();
      });
      originalOnDestroy.apply(this);
    };

  }
}

// These are created and subscribed to when the component is instantiated. It is usually better to do so in ngOnInit.
export function PropertySubscription(params) {
  return function (target: any, key: string) {
    if(this[key]) {
      this.subs.push(this[key]);
    } else {
      throw new Error('Invalid property value. Must be a Subscription.')
    }
  };
}

/* default params:
{
  immediate: false
}
*/
export function MethodSubscription(params) {
  // merge params and defaults
  params = Object.assign({}, {
    immediate: false
  }, params);
  return function (target: any, key: string, descriptor: any) {
    console.log('Method Subscription target: ', target);
    const invalidValueError = new Error('Invalid return value from @MethodSubscription. Must be an array of Subscriptions or a Subscription');
    
    const originalValue = descriptor.value;

    const handleMethodSubscription = function(...args: any[]) {
      const result = originalValue.apply(this, args);

      console.log('handle methodSubscription result: ', result);

      if(result instanceof Array) {
        console.log('handling array methodSubscription');
        result.map((sub) => {
          if(sub.constructor === Subscription) {
            this.subs.push(sub);
          } else {
            throw invalidValueError;
          }
        });
      } else if (result instanceof Subscription) {
        console.log('handling value methodSubscription');
        this.subs.push(result);
      } else {
        console.log('handling invalid methodSubscription');
        throw invalidValueError;
      }
    };

    // The default behavior is to wait to fire the subscription until ngOnInit is fired. 
    // Setting immediate to true will subscribe when the component is instantiated.
    if(params.immediate !== true) {
      setupSubscriberMethods(target);
      target.subscriberMethods.push(handleMethodSubscription);
      descriptor.value = function (...args: any[]) {
        // warns that this method should not be called directly from here
        console.warn('@MethodSubscriptions should not be called directly.');
      };
    } else {
      descriptor.value = handleMethodSubscription;
    }

    return descriptor;

  };
}

// Used to unsubscribe all subs in a method other than ngOnDestroy. 
// Not sure if needed, left over from initial implementation before a refactor.
export function Unsubscribe(target: any, key: string, descriptor: any) {

  const originalValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    this.subs.map(function(sub) {
      sub.unsubscribe();
    });
    originalValue.apply(this, args);
  };

  return descriptor;

}