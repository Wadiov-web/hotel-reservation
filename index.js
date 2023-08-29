const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const Host = require('./db/models/host')
const User = require('./db/models/user')
const session = require('express-session')
const multer = require('multer')

const PORT = 5000 || process.env.PORT

app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/booking', {
    useNewUrlParser: true, useUnifiedTopology: true
}, (err) => {
    if (err) {
        console.log('database connection failed' + err)
    } else {
        console.log('database connection established')
        app.listen(PORT, () => {
            console.log(`Server is listening on PORT ${PORT}`)
        })
    }
})





app.use(express.static(path.join(__dirname, '/pages/search')))
app.use(express.static(path.join(__dirname, '/pages/register-option')))
app.use(express.static(path.join(__dirname, '/pages/host-register')))
app.use(express.static(path.join(__dirname, '/pages/host-login')))
app.use(express.static(path.join(__dirname, '/pages/about-us')))

app.use(express.static(path.join(__dirname, '/views')))
app.use(express.static(path.join(__dirname, '/images')))




app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 1000 * 60 * 24 * 2,
    }
}))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
    Host.find()
    .then(hosts => {
        res.render('search', {hosts})
    }).catch(err => console.log(err))
})
app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/register-option/registerOption.html'))
})
app.get('/host/register', notAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/host-register/hostRegister.html'))
})

app.get('/host/login', notAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/host-login/hostLogin.html'))
})

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/about-us/aboutus.html'))
})

// upload images
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/images')
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter
})
const handleFile =  upload.single('image')




app.get('/host/profile', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        res.render('profile', {host: host})
    })
    .catch(err => console.log(err))
})
app.post('/host/addinfo', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        console.log(req.body)
        host.infos.push({
            cat: req.body.category,
            room: req.body.room,
            from: req.body.from,
            price: req.body.price
        })
       
        host.save()
        res.redirect('/host/profile')
    })
    .catch(err => console.log(err))
})
app.post('/host/addimage', isAuth, handleFile, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        host.images.push(req.file.filename)
        host.save()
        res.redirect('/host/profile')
    }).catch(err => console.log(err))
})

app.post('/host/editCat', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        console.log(req.body)
        // host.infos.push({
        //     cat: req.body.category,
        //     room: req.body.room,
        //     from: req.body.from,
        //     price: req.body.price
        // })
        host.infos.forEach(c => {
            if(req.body.catg == c.cat){
                c.room = req.body.room
                c.from = req.body.from
                c.price = req.body.price
            }
        })
        host.save()
        res.redirect('/host/profile')
    })
    .catch(err => console.log(err))
})
app.post('/host/delCat', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        console.log(req.body)
        host.infos = host.infos.filter(c => c.cat !== req.body.catg)

        host.save()
        res.redirect('/host/profile')
    })
    .catch(err => console.log(err))
})
app.post('/host/infos', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        
        host.hostName = req.body.hostName       
        host.address = req.body.address
        host.website = req.body.website
        host.stars = req.body.stars

        host.save()
        res.redirect('/host/profile')
    })
    .catch(err => console.log(err))
})

app.get('/host/inbox', isAuth, (req, res) => {
    Host.findOne({_id: req.session.hostID})
    .then(host => {
        res.render('inbox', {host})
    })
    .catch(err => console.log(err))
})


app.post('/search', (req, res) => {
    Host.find()
    .then(hosts => {
        let byCountry = hosts.filter(host => host.country.toUpperCase() == req.body.search.toUpperCase())
        if(byCountry.length > 0){
            res.render('results', {hosts: byCountry})
        } else {
            let byCity = hosts.filter(host => host.hostCity.toUpperCase() == req.body.search.toUpperCase())
            if(byCity.length > 0){
                res.render('results', {hosts: byCity})
            } else {
                res.render('results', {hosts: byCity})
            }
        }
    }).catch(err => console.log(err))
})

app.get('/book/:name', (req, res) => {
    Host.findOne({hostName: req.params.name})
    .then(host => {
        res.render('booking', {host})    
    }).catch(err => console.log(err))
})

app.post('/book-now/', userIsAuth, (req, res) => {
    console.log('My Body')
    console.log(req.body)

    User.findOne({_id: req.session.userID})
    .then(user => {

        Host.findOne({hostName: req.body.hostName})
        .then(host => {

            host.requests.push({
                by: user.username,
                catg: req.body.cat,
                from: req.body.from,
                to: req.body.to,
                rooms: req.body.rooms,
                days: req.body.days,
                totalPrice: req.body.totalPrice
            })
            host.save()
            res.send(`<h1>booking is requested successfully</h1>
            <p>you will receive response within the next 24 hours</p>`)

        }).catch(err => console.log(err))
   
    }).catch(err => console.log(err))
    
})

app.post('/host/accept', (req, res) => {
    console.log(req.body)

    Host.findOne({_id: req.session.hostID})
    .then(host => {
        let userRequest = host.requests.find(r => r.by == req.body.user)
      
        User.findOne({username: userRequest.by})
        .then(user => {
            user.inbox.push({
                by: host.hostName,
                catg: userRequest.catg,
                from: userRequest.from,
                to: userRequest.to,
                rooms: userRequest.rooms,
                days: userRequest.days,
                totalPrice: userRequest.totalPrice,
                status: true
            })
            // sub rooms
            host.infos.forEach(c => {
                if(c.cat == userRequest.catg){
                    c.room = c.room - parseInt(userRequest.rooms)
                }
            })
            // add to notification
            host.notification.push({
                by: userRequest.by,
                catg: userRequest.catg,
                from: userRequest.from,
                to: userRequest.to,
                rooms: userRequest.rooms,
                days: userRequest.days,
                totalPrice: userRequest.totalPrice,
                status: true
            })
            //delete from requests
            host.requests = host.requests.filter(r => r.totalPrice !== userRequest.totalPrice)

            host.save()
            user.save()
            res.redirect('/host/inbox')
        })
    }).catch(err => console.log(err))
})
app.post('/host/decline', (req, res) => {
    console.log(req.body)

    Host.findOne({_id: req.session.hostID})
    .then(host => {
        let userRequest = host.requests.find(r => r.by == req.body.user)
      
        User.findOne({username: userRequest.by})
        .then(user => {
            user.inbox.push({
                by: host.hostName,
                catg: userRequest.catg,
                from: userRequest.from,
                to: userRequest.to,
                rooms: userRequest.rooms,
                days: userRequest.days,
                totalPrice: userRequest.totalPrice,
                status: false
            })
            // add to notification
            host.notification.push({
                by: userRequest.by,
                catg: userRequest.catg,
                from: userRequest.from,
                to: userRequest.to,
                rooms: userRequest.rooms,
                days: userRequest.days,
                totalPrice: userRequest.totalPrice,
                status: false
            })
            //delete from requests
            host.requests = host.requests.filter(r => r.totalPrice !== userRequest.totalPrice)

            host.save()
            user.save()
            res.redirect('/host/inbox')
        })
        
    }).catch(err => console.log(err))
})

///////////////////////////////////////////////////////////////////////////////////////////////////////
function userIsAuth(req, res, next){
    if(req.session.userID){
        return next()
    } else {
        //return res.json({msg: 'you are not authenticated'})
        return res.redirect('/user/login')
    }
}
function userNotAuth(req, res, next){
    if(req.session.userID){
        return res.redirect('/user/profile')
    } else {
        return next()
    }
}
app.get('/user/register', userNotAuth, (req, res) => {
    res.render('registerUser')    
})
app.get('/user/login', userNotAuth, (req, res) => {
    res.render('loginUser')    
})

app.post('/user/register', (req, res) => {
    console.log('user')
    console.log(req.body)

    const { email, password, username } = req.body
    if(email && password && username){
        User.findOne({email: email})
        .then(user => {
            if(user) {
                res.json({msg: 'email is already registered'})
            } else {
                let shouldRegister = true
                if(password.length < 5 || password.length > 30) {
                    res.json({msg: 'password length must be between 5 char and 30'})
                    console.log('password length must be between 5 char and 30')
                    shouldRegister = false
                }
                if(shouldRegister) {
                    const newUser = new User({
                        email,
                        password,
                        username
                    })
                    newUser.save()
                    .then(myuser => {
                        res.redirect('/user/login')
                    }).catch(err => console.log(err))
                }
            }
        }).catch(err => console.log(err))
    } else {
        console.log('Provide all data')
        res.json({msg: 'Provide all data'});
    }
})

app.post('/user/login', (req, res) => {
    console.log(req.session)
    const {email, password} = req.body
    if (email && password) {
        User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.json({msg: 'user not found'})
            }
            if (user.password !== password) {
                return res.json({msg: 'password incorrect'})
            } else {
                req.session.userID = user._id
                console.log(req.session)
                return res.redirect('/user/profile')
            }
        }).catch(err => {
            res.json({error: 'something wrong in the server'})
        })
    } else {
        res.json({msg: 'please fill in all fields'})
    }
})





app.get('/user/profile', userIsAuth, (req, res) => {

    User.findOne({_id: req.session.userID})
    .then(user => {
        res.render('userProfile', {user})
    }).catch(err => console.log(err))  
})



app.post('/user/delete', userIsAuth, (req, res) => {
    console.log(req.body)
    User.findOne({_id: req.session.userID})
    .then(user => {

        user.inbox = user.inbox.filter(i => i.totalPrice !== req.body.inbox)
        console.log(user.inbox)
        user.save()
        res.redirect('/user/profile')
    }).catch(err => console.log(err))  
})

app.post('/user/logout', userIsAuth, (req, res) => {
    req.session.destroy(err => {
        if(err){
            return res.status(500).json({msg: 'error'})
        }
        return res.redirect('/user/login')
    })
})









//////////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/host/register', (req, res) => {
    console.log('mmmmmmmmmmmmmm')
    console.log(req.body)

    const { email, password, hostName, country, hostCity } = req.body
    if(email && password && hostName && country && hostCity){
        Host.findOne({email: email})
        .then(host => {
            if(host) {
                res.json({msg: 'email is already registered'})
            } else {
                let shouldRegister = true
                if(password.length < 5 || password.length > 30) {
                    res.json({msg: 'password length must be between 8 char and 30'})
                    console.log('password length must be between 8 char and 30')
                    shouldRegister = false
                }
                if(shouldRegister) {
                    const newHost = new Host({
                        email,
                        password,
                        hostName,
                        country,
                        hostCity
                    })
                    newHost.save()
                    .then(myuser => {
                        res.json({msg: 'success'})
                    }).catch(err => console.log(err))
                }
            }
        }).catch(err => console.log(err))
    } else {
        console.log('Provide all data')
        res.json({msg: 'Provide all data'});
    }
})

function isAuth(req, res, next){
    if(req.session.hostID){
        return next()
    } else {
        //return res.json({msg: 'you are not authenticated'})
        return res.redirect('/host/login')
    }
}

function notAuth(req, res, next){
    if(req.session.hostID){
        return res.redirect('/host/profile')
    } else {
        return next()
    }
}




app.post('/host/login', (req, res) => {
    console.log(req.session)
    const {email, password} = req.body
    if (email && password) {
        Host.findOne({email: email})
        .then(host => {
            if (!host) {
                return res.json({msg: 'host not found'})
            }
            if (host.password !== password) {
                return res.json({msg: 'password incorrect'})
            } else {
                req.session.hostID = host._id
                console.log(req.session)
                return res.json({msg: 'success'})
            }
        }).catch(err => {
            res.json({error: 'something wrong in the server'})
        })
    } else {
        res.json({msg: 'please fill in all fields'})
    }
})





app.post('/host/logout', isAuth, (req, res) => {
    req.session.destroy(err => {
        if(err){
            return res.status(500).json({msg: 'error'})
        }
        return res.redirect('/host/login')
    })
})
