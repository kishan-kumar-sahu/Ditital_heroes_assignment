import {Charity} from '../models/index.js';
export async function list(req,res){res.json({charities:await Charity.find().lean()})}
export async function one(req,res){const c=await Charity.findById(req.params.id).lean();res.status(c?200:404).json(c?{charity:c}:{error:'Charity not found'})}
export async function create(req,res){if(!req.body.name)return res.status(400).json({error:'Name required'});res.status(201).json({charity:await Charity.create({name:req.body.name,description:req.body.description||'',image:req.body.image||'/assets/charity-default.svg',featured:!!req.body.featured})})}
export async function update(req,res){const c=await Charity.findByIdAndUpdate(req.params.id,{name:req.body.name,description:req.body.description,image:req.body.image,featured:req.body.featured},{new:true});res.status(c?200:404).json(c?{charity:c}:{error:'Charity not found'})}
export async function remove(req,res){const c=await Charity.findByIdAndDelete(req.params.id);res.status(c?200:404).json(c?{ok:true}:{error:'Charity not found'})}
