# Fluent

Fluent is a lightweight TypeScript library designed to help you build complex, strongly typed fluent APIs with ease. It provides a flexible and intuitive way to create and execute chains of operations, which can include validations, data transformations, API calls, and more. Fluent simplifies the process of constructing these operation chains. When used effectively, it allows you to write logic that reads like the business requirement equivalent, making it easier to align your code with business rules. Additionally, Fluent's programming paradigm encourages the use of small, reusable methods, which enhances testability and supports robust and reliable development.

## Motiviation

[Fluent Interface](https://en.wikipedia.org/wiki/Fluent_interface) patterns can make your code very succinct and semantic. This can be extermely beneficial for complex business logic. But traditional fluent interface patterns have some challenged with [error capture](https://en.wikipedia.org/wiki/Fluent_interface#Errors_cannot_be_captured_at_compile_time), [debugging](https://en.wikipedia.org/wiki/Fluent_interface#Debugging_and_error_reporting), [logging](https://en.wikipedia.org/wiki/Fluent_interface#Logging), [subclassing](https://en.wikipedia.org/wiki/Fluent_interface#Subclasses), [maintenance](https://www.yegor256.com/2018/03/13/fluent-interfaces.html#:~:text=Fluent%20interfaces%20are%20good%20for%20users%2C%20but%20bad%20for%20library,an%20advantage%2C%20not%20a%20drawback.). Furthermore methods and their relationships must be known at the time you're building them, you have to make assumptions about how they'll be used. 

Leveraging TypeScript, Proxies and the concept of context... Fluent allows you to build fluent apis without the challenges and some added benefit.

## Installation

To install Fluent, use npm:

```bash
npm install fluent
```

## Usage

### Creating a Fluent API

To create a fluent API, use the fluent function and pass in your API structure. The API structure defines the available methods and their expected behavior.

Here we'll create a validator with a namespace for `string` and some chainable methods `min` and `max` for further checks. Well use the context `value` and `errors` props you could do whatever you want with the context. Note we're not throwing any errors, rather we're checking for them. We want to continue execution because we don't know what will happen next in the chain.

```typescript
type Context = {
  value: any,
  errors: string[],
}

const string = (ctx: any) => {
  if (typeof ctx.value !== "string") {
    ctx.errors.push("Value must be a string");
  }
};

const min = (ctx: any, len: number) => {
  string(ctx);
  if (!ctx.errors.length && ctx.value.length < len) {
    ctx.errors.push("String is too short");
  }
}

const max = (ctx: any, len: number) => {
  string(ctx);
  if (!ctx.errors.length && ctx.value.length > len) {
    ctx.errors.push("String is too long");
  }
}

export type Methods = {
  string: {
    min: (len: number) => void,
    max: (len: number) => void,
  };
};

export const methods = {
  string: {
    min,
    max,
  },
};
```

### Building an Operation Chain

Once you have created the fluent API, you can build an operation chain by calling the methods in a fluent manner, chaining one method call after another.

```typescript

const api = {
  validate: methods as Methods
}

const { validate } = fluent(api);

```
What you get is a fully typed exucition chain of all the methods you provided.
```typescript
validate.string.min(2).max(8);
```

### Executing the Operations

To execute the operations defined in your chain, use the run function. This function takes the operation chain, context, and API structure as parameters.

```typescript
// initialize the context

const ctx = { value: 'this string is way too long', errors: [] };
const ops = validate.string.min(2).max(10);

const result = run({ api, ctx, ops })

console.log(result) 
// { value: 'this string is way too long', errors: [ 'String is too long' ] }

```

## API Reference

### fluent(apiStructure)

Parameters:
- `apiStructure`: An object defining the structure and methods of your API. 
- `Returns`: A fluent API instance.

### run({ ops, ctx, api })

Parameters:
- `ops`: The operation chain generated by the fluent API.
- `ctx`: The context object that will be passed to each method in the operation chain.
- `api`: The original API structure.
- `Returns`: The context object after executing the operations. 
- `Returns` a promise if any operations in the chain return a promise.

## Use Case Examples

Fluent can be used in various scenarios. Here are just a few examples to demonstrate its versatility. 

### Common Imports

```typescript
import { methods as stringMethods } from "./validator/string";
import { methods as emailMethods } from "./api/email";
import { methods as userMethods } from "./api/users";
import { fluent, run } from "fluent";
```

### Validation

You can use Fluent to create validator chains:

```typescript
const api = {
  validate: {
    string: {
      pattern: (regex: string) => void,
      require: () => void,
    }
  },
};

const { validate } = fluent(api);

// make sure this is a valid email
const isEmail = validate.string.pattern(/^\S+@\S+.\S+$/.source).required;

const emails = ["test@email.com", undefined, 12324, "invalidemail"];

// you can setup your fluent methods to work with any ctx shape you'd like. here we're setting email to ctx.value and errors 
emails.forEach((email) => {
  const result = run({ 
    ops: isEmail, 
    ctx: { value: email, errors: [] }, 
    api 
  });
  console.log(result);
});
```

### Combined and Async Operations

Fluent APIs can be combined/chained and are capable of running async operations such as restful calls:

```typescript
const api = {
  validate: stringMethods,
  server: {
    email: emailMethods,
    user: userMethods,
  },
};

// Combine the validate and server fluent apis
const { validate, server } = fluent(api);

// validate the string is an email
// then try to register the user
// then send a welcome email
const register = 
  validate.string.pattern(/^\S+@\S+.\S+$/.source).required.
  server.user.register.
  server.user.registered(a.email.welcome);

const emails = ["test@bob.com", undefined];

emails.forEach((email) => {
  const result = run({ 
    ops: register, 
    ctx: { value: email, errors: [] }, 
    api 
  });
  console.log(result);
});
```

See the examples folder for more details.

## Serializing & Sharing Operation Chains
Operation chains can be serialized to `JSON`, which means they can be stored or shared acoess systems. Suppose you have a validation chain that is used to validate an input on the client. That chain can be stored to a database, then reused to validate on the server.

```typescript

const isEmail = validator.string.pattern(/^\S+@\S+\.\S+$/.source);
console.log(JSON.stringify(isEmail, null, 2));
// [{ method: 'string.pattern', args: '^\\S+@\\S+\\.\\S+$' }]
```

## Be Creative

In closing, fluent can be used for anything... be creative about it. If we think of it in terms of touring completeness we can create logical operand methods: 

- `or(v.string.email, v.string.phone_numer).api.registerUser`

And even loops
- `while(user.hasCheckoutItems, email.sendReminder, 1000)`

Context can be anything you want. You can use an observable data struct for front end reactivity, a logger, a data object, transform operation etc.

Some problem spaces that seem particularly suited to fluent apis: 
- Data validation and sanitization
- Chaining API calls with structured error handling
- Implementing complex business logic
- Orchestrating multi-step workflows
- Creating reusable and testable methods
- Building dynamic query builders
- Data processing with complex requirements
- Managing feature toggles and configurations
- Handling user authentication and authorization flows
- Aggregating and processing data from multiple sources
- Coordinating event-driven actions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
