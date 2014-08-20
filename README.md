Vend It Up!
===========

If only it were the real thing...
---------------------------------
This is an app that mimics the behavior of a standard drink vending machine. A user can put money in, select a drink, and get change.
The database keeps count of all beverages, quantities of money by denomination, and a detailed transaction log that includes the time of each
purchase as well as records of the exact types and numbers of coins dispensed as change. The app starts of as a clean slate, allowing a user
to add their own beverage products and corresponding logos as well as a front-panel image for the user interface. A user can change the number
of beverages and currency denominations at any time, and the user can reset the transaction log as well.


Vend It Up! uses the speed of Node's non-blocking, asyncronous mechanisms combined with the flexibility and ease of MongoDB. The front-end
framework utilized is Zurb's Foundation.

Deployment Instructions:
------------------------

+ Run `git clone https://github.com/drewmoore/vending`.
+ If you don't already have Vagrant installed, run `sudo apt-get install vagrant` (Requires VirtualBox), or whatever command your linux distro uses.
+ Run `vagrant box add hashicorp/precise64 http://files.vagrantup.com/precise64.box`.
+ Run `vagrant up`.

+ Vagrant's virtual box will download and install the necessary repositories and run the test suite.
+ When the Node server is running, load `http://127.0.0.1:4567/` into your browser.

Using the App
-------------
Once you have installed the app and have it running, if you load the home page for the first time, it will prompt you to create a new machine
instance with its own price and front image. It is recommended to use as large an image as possible in a portrait orientation. Next, you will be
prompted to add at least one beverage with a corresponding logo image and a specified quantity to stock.
This start-up process will lead you to the new homepage, featuring your brand new vending machine with a button for your brand new beverage.
What's that? You want more beverages to choose from? Well, you're in luck, because the site comes equiped with a navigation bar at the top of
the page. Simply click 'New Beverage,' and repeat the process from earlier. The machine has six slots for beverages and will return an error
message if you attempt to add more. If you wish to change the quantity or logo image for a beverage or swap the beverage with a new one, click
'Change Beverages' in the navigation bar.


You can also edit the numbers of coins of a given denomination, empty all paper bills, and change the machine's front-panel image by clicking
'Administer Machine.'


Vend It Up! keeps detailed records of all transactions. If you simply wish to view a summary of the current state of the machine, click on
'Summary' in the navigation bar. If you're not into the whole brevity thing, click on 'Records' to see a detailed transaction log with the
values of all currency denominations in the machine. It will also break down the quantity of each beverage product that is stocked. You can
peruse the detailed transaction history, or click a button to reset it.


API Documentation
-----------------
If you're the type that likes to pop open the hood and tinker around, here's a little primer on the app's client-server communications.
To create a machine instance, post to `/machines/create`. The only data necessary are a `price` and `imageFile`. To edit the machine's price
and image, post to `/machines/update/:id` with the id being the machine's database ID. Again, all that is needed is a `price` and `imageFile`.


To add a new beverage product, post to `/beverageTypes/create` with a `name`, `quantity`, and `imageFile` as properties of the request body.
If you want to swap a beverage product, change its image, or change its quantity, post to `/beverageTypes/update`. You will need to send a
`beverageId`, which is the database ID for the beverage product. You can supply an optional `name` property if you want to swap out the beverage.
The name provided will be the new product name for that slot. You can provide an optional `imageFile` if you wish to change the logo. A
`quantity` is required, but it does not have to be different from the beverage's current quantity.


If you wish to manage the level of change in the machine, you can post to `/currencies/update`. The request body must include a quantity for
each denomination the machine accepts, i.e.: `nickel: 3`, `quarter: 20`, `dime: 0`, `dollarCoin: 0`, `dollarBill:0`, and `fiveDollarBill:2`.
The quantity can be the same as the current quantity, but it must not be left undefined.


To utilize the machine's 'coin return' button, which gives you change without vending a product, the route you would want is
`/machines/return-coins`. The data to send is an object with it's properties being all currencies going in and their quantity. For example:
`.currencies.quarter: 3`. Again, all denominations must be represented, even if the quantity is 0. The server will send back three objects:
`coinsDispensed`, `totalChange`, and `stateOfMachine`. Examples:
`coinsDispensed.quarter.name: 'quarter';`
`coinsDispensed.quarter.count: 2;`
`totalChange: .5;`
`stateOfMachine.inService: true;`


To make a purchase, post to `/machines/make-purchase`. Include the `machineId` and `beverageTypeId` in the body, as well as the total `value` of all the money
going in. Also inclue each currency and quantity. Examples:
`machineId: 12345;`
`beverageTypeId: 12345;`
`value: 1.25;`
`quarter: 1;`
`dollarCoin: 1;`


Finally, if you wish to erase the transaction history, simply post to `/transactions/reset`.

Enjoy!
