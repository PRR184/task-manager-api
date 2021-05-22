const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()


//Create a User(Sign Up)
router.post('/users',async (req, res) => {
    const user = new User(req.body)
    
    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }


})

//Login
router.post('/users/login',async (req,res)=>{
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    } catch (e) {
        res.status(400).send(e)
    }
})

//Logout all users
router.post('/users/logout',auth,async (req,res)=>{
    try {

        req.user.tokens = req.user.tokens.filter((token)=>token.token !== req.token)
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//Logout All users
router.post('/users/logoutAll',auth,async (req,res)=>{
    try {

        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Fetch Profile of User
router.get('/users/me', auth , async (req, res) => {
    res.send(req.user)
})


//Update a single User
router.patch('/users/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update)=>allowUpdates.includes(update))
    if(!isValidOperation)
    {
        return res.status(400).send({error:'inavalid Updates'})
    }
    try {

        //const user = await User.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})
        //Restructure to take advantage of middleware

        const user = req.user


        updates.forEach((update)=>user[update]=req.body[update])
        await user.save()       

        res.send(user)
    } catch (e) {
        res.status(400).send(e)        
    }
})

//Delete a single user
router.delete('/users/me', auth, async (req,res)=>{
    try {


        await req.user.remove()
        res.send(req.user)    

    } catch (e) {
        res.status(500).send()         
    }
})

const upload = multer({
    limits:{
        fileSize:1000000,
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
        {
            return cb(new Error('Please provide files with extension jpg or jpeg or png'))
        }
        cb(undefined,true)
    }
})
//To upload profile pic
router.post('/users/me/avatar', auth, upload.single('avatar'),async (req,res)=>{
    // req.user.avatar = req.file.buffer

    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

//to remove profile pic
router.delete('/users/me/avatar',auth,async (req,res)=>{
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send()        
    } catch (e) {
        res.status(500).send()
    }

})

//serving up profile pic
router.get('/users/:id/avatar',async(req,res)=>{
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar)
            throw new Error()
        res.set('content-type','image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router