import {User,Subscription,Score,Charity} from '../models/index.js'; import {hashPassword} from './security.js';
export async function seed(){
 if(await Charity.countDocuments()===0) await Charity.insertMany([
  {name:'Save the Children',description:'Helping children build a better future.',image:'/assets/charity-children.svg',featured:true},
  {name:'World Wildlife Fund',description:'Protecting wildlife and natural habitats.',image:'/assets/charity-wildlife.svg'},
  {name:'Cancer Research UK',description:'Funding research for better cancer treatments.',image:'/assets/charity-research.svg'},
  {name:'Feeding America',description:'Working to end hunger across communities.',image:'/assets/charity-food.svg'}]);
 let admin=await User.findOne({email:(process.env.ADMIN_EMAIL||'admin@digitalheroes.co.in').toLowerCase()}); if(!admin) await User.create({name:'Admin',email:(process.env.ADMIN_EMAIL||'admin@digitalheroes.co.in').toLowerCase(),passwordHash:hashPassword(process.env.ADMIN_PASSWORD||'Admin@12345'),role:'admin'});
 let demo=await User.findOne({email:'demo@digitalheroes.co.in'}); if(!demo) demo=await User.create({name:'John Smith',email:'demo@digitalheroes.co.in',passwordHash:hashPassword('Demo@12345'),role:'subscriber'});
 const charity=await Charity.findOne(); if(!await Subscription.findOne({userId:demo._id})){const r=new Date();r.setMonth(r.getMonth()+1);await Subscription.create({userId:demo._id,plan:'monthly',amount:20,status:'active',charityId:charity._id,contributionPercent:10,nextRenewal:r.toISOString().slice(0,10)})}
 if(await Score.countDocuments({userId:demo._id})===0) await Score.insertMany([['2025-04-20',42],['2025-04-15',38],['2025-04-10',35],['2025-04-05',31],['2025-03-28',29]].map(([date,score])=>({userId:demo._id,score,date})));
}
