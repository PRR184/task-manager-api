const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()



//Create a new Task
router.post('/tasks',auth,async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner:req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }

})

//Fetch Multiple Tasks
//GET tasks?completed=true
//GET tasks?limit=10&skip=10
//GET tasks?sortBy=createdAt:asc
router.get('/tasks',auth,async(req,res)=>{
    const match = {}
    const sort = {}
    if(req.query.completed)
    {
        match.completed = (req.query.completed === 'true')
        //because req.query.completed gives string value ,so we convert into boolean
    }
    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = (parts[1]==="desc"?-1:1)
    }
    try {

        // const tasks = await Task.find({})
        // res.send(tasks)

        const user = req.user
        await user.populate({
            path:'tasks',
            match:match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort:sort
            }
        }).execPopulate()

        res.send(user.tasks)

    } catch (e) {
        res.status(500).send()
    }


})

//Fetch Single Task
router.get('/tasks/:id',auth,async(req,res)=>{
    const _id = req.params.id
    try {
        // const task = await Task.findById(id)
        const task = await Task.findOne({_id,owner:req.user._id})

        if(!task)
            return res.status(404).send()
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }


})

//Update a single Task
router.patch('/tasks/:id',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowUpdates = ['description','completed']
    const isValidOperation = updates.every((update)=>allowUpdates.includes(update))
    if(!isValidOperation)
    {
        return res.status(400).send({error:'inavalid Updates'})
    }
    try {
        // const task = await Task.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})

        // const task = await Task.findById(req.params.id)

        const  task = await Task.findOne({_id:req.params.id,owner:req.user._id})

        if (!task){
            return res.status(404).send()
        }
        
        updates.forEach((update)=>task[update]=req.body[update])
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(400).send(e)        
    }
})
//Delete a single task
router.delete('/tasks/:id',auth,async (req,res)=>{
    try {
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)    
    } catch (e) {
        res.status(500).send()         
    }
})

module.exports = router

