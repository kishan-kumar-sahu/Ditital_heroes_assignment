from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
OUT=Path('/mnt/data/digital-heroes/screenshots')
W,H=1440,920
try:
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
    bold=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',16)
    h1=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',30)
    h2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',20)
    big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
except: font=bold=h1=h2=big=None
NAV=(10,27,46); BG=(245,248,251); WHITE=(255,255,255); LINE=(226,233,240); TEXT=(19,34,56); MUTED=(108,124,144); GREEN=(16,185,129); PURPLE=(109,74,255)
def rr(d,box,r,fill,outline=None): d.rounded_rectangle(box,radius=r,fill=fill,outline=outline)
def txt(d,p,s,f=font,fill=TEXT): d.text(p,s,font=f,fill=fill)
def base(title,admin=False):
    im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    d.rectangle((0,0,230,H),fill=NAV)
    rr(d,(18,18,56,56),12,GREEN);txt(d,(28,25),'♥',bold,WHITE);txt(d,(65,20),'Digital Heroes',bold,WHITE);txt(d,(65,43),'Play Golf. Create Impact.',font,(170,195,210))
    items=(['Dashboard','Users Management','Draw Management','Charity Management','Winner Management','Reports & Analytics','Settings'] if admin else ['Dashboard','My Subscription','My Scores','Charity','Draws','Winnings','Payment History','Profile','Settings'])
    for i,it in enumerate(items):
        y=85+i*43
        if i==0: rr(d,(12,y,216,y+35),8,GREEN if not admin else PURPLE)
        txt(d,(30,y+9),'●',font,WHITE if i==0 else (160,180,198));txt(d,(52,y+8),it,font,WHITE if i==0 else (185,201,215))
    rr(d,(15,H-95,215,H-18),12,(16,43,67));txt(d,(30,H-75),'Your support changes lives.',bold,WHITE);txt(d,(30,H-53),'Together you make a difference.',font,(185,201,215))
    d.rectangle((230,0,W,72),fill=WHITE);d.line((230,71,W,71),fill=LINE,width=1);rr(d,(250,17,290,57),20,(225,232,240));txt(d,(262,26),'J' if not admin else 'A',bold,TEXT);txt(d,(304,18),'Welcome back,',font,MUTED);txt(d,(304,39),title,bold,TEXT);rr(d,(410,29,515,56),14,(229,248,241));txt(d,(425,35),'Active Member' if not admin else 'Administrator',font,(7,143,100))
    return im,d

def card(d,x,y,w,h): rr(d,(x,y,x+w,y+h),16,WHITE,LINE)
def user():
 im,d=base('John Smith')
 card(d,250,92,1160,245); rr(d,(250,92,1410,337),16,(20,70,76));
 txt(d,(280,125),'Your scores can create real change.',h1,WHITE);txt(d,(280,167),'Play, win, and support amazing charities. Every score makes a difference.',font,(215,235,230));rr(d,(280,220,455,262),10,GREEN);txt(d,(304,232),'＋ Add New Score',bold,WHITE)
 rr(d,(1130,112,1388,312),16,(12,32,50));
 for i,(a,b) in enumerate([('Total winnings','$250'),('Charity contribution','$2'),('Draws entered','3')]):txt(d,(1150,132+i*52),a,font,(200,215,226));txt(d,(1305,130+i*52),b,bold,WHITE)
 metrics=[('Latest score','42'),('Next draw','May 31, 2025'),('Selected charity','Save the Children'),('Total winnings','$250')]
 for i,(a,b) in enumerate(metrics):
  x=250+i*290;card(d,x,355,270,105);txt(d,(270,372),a,font,MUTED);txt(d,(270,404),b,bold,TEXT)
 # lower cards
 card(d,250,478,390,365);txt(d,(270,500),'My recent golf scores',h2);txt(d,(520,505),'5/5 retained',font,MUTED)
 rows=[('Apr 20, 2025','42'),('Apr 15, 2025','38'),('Apr 10, 2025','35'),('Apr 5, 2025','31'),('Mar 28, 2025','29')]
 for i,(date,score) in enumerate(rows):
  y=550+i*52;d.line((270,y+32,620,y+32),fill=LINE);txt(d,(270,y),date,font,TEXT);rr(d,(500,y-4,535,y+24),12,(220,248,236));txt(d,(510,y),score,bold,(7,143,100))
 card(d,660,478,370,365);txt(d,(680,500),'Upcoming draws',h2);txt(d,(680,505+38),'Monthly cadence',font,MUTED)
 for i,dt in enumerate(['May 31, 2025','Jun 30, 2025','Jul 31, 2025']):
  y=560+i*85;d.line((680,y+52,1000,y+52),fill=LINE);txt(d,(680,y),dt,bold,TEXT);txt(d,(680,y+27),'Upcoming · prize pool calculated automatically',font,MUTED)
 card(d,1050,478,360,365);txt(d,(1070,500),'Your charity impact',h2);txt(d,(1070,536),'10% contribution',font,MUTED)
 d.ellipse((1080,585,1210,715),outline=GREEN,width=13);d.ellipse((1100,605,1190,695),fill=WHITE);txt(d,(1125,640),'10%',bold,TEXT);txt(d,(1235,595),'Save the Children',bold,TEXT);txt(d,(1235,625),'$2 charity contribution',font,MUTED)
 im.save(OUT/'user-dashboard.png')
def admin():
 im,d=base('Admin',True)
 txt(d,(250,95),'Admin Dashboard',h1,TEXT);txt(d,(250,134),'Overview of platform activity and key metrics',font,MUTED)
 vals=[('Total Users','248'),('Active Subscriptions','186'),('Total Prize Pool','$12,480'),('Charity Contribution','$2,496')]
 for i,(a,b) in enumerate(vals):
  x=250+i*290;card(d,x,175,270,110);txt(d,(270,195),a,font,MUTED);txt(d,(270,228),b,big,TEXT);txt(d,(270,263),'+12% from last month',font,(7,143,100))
 card(d,250,305,570,235);txt(d,(270,325),'Monthly User Growth',h2);basey=500
 heights=[60,85,90,120,130,145,175];labels=['Mar','Apr','May','Jun','Jul','Aug','Sep']
 for i,h in enumerate(heights):
  x=285+i*70;d.rectangle((x,basey-h,x+38,basey),fill=PURPLE);txt(d,(x,505),labels[i],font,MUTED)
 card(d,840,305,570,235);txt(d,(860,325),'Subscription Plan Distribution',h2);d.ellipse((875,365,1015,505),fill=PURPLE);d.pieslice((875,365,1015,505),90,306,fill=GREEN);d.ellipse((905,395,985,475),fill=WHITE);txt(d,(932,422),'60%',bold,TEXT);txt(d,(1040,390),'Monthly  60%',font,TEXT);txt(d,(1040,430),'Yearly   40%',font,TEXT)
 card(d,250,560,570,280);txt(d,(270,580),'Recent Users',h2);txt(d,(690,585),'View all',font,PURPLE)
 for i,(n,e,p,s) in enumerate([('Sarah Johnson','sarah@domain.com','Yearly','Active'),('Mike Davis','mike@domain.com','Monthly','Active'),('Emma Wilson','emma@domain.com','Monthly','Active'),('James Brown','james@domain.com','Yearly','Lapsed')]):
  y=625+i*48;d.line((270,y+29,800,y+29),fill=LINE);txt(d,(270,y),n,font,TEXT);txt(d,(430,y),e,font,MUTED);txt(d,(625,y),p,font,TEXT);txt(d,(710,y),s,font,(7,143,100) if s=='Active' else (190,55,80))
 card(d,840,560,570,280);txt(d,(860,580),'Recent Draw Results',h2);txt(d,(1260,585),'View all',font,PURPLE)
 for i,row in enumerate([('5 Match','Jackpot','$4,800','Rollover'),('4 Match','2 Winners','$1,680','Paid'),('3 Match','5 Winners','$1,200','Paid')]):
  y=630+i*55;d.line((860,y+30,1385,y+30),fill=LINE);txt(d,(860,y),row[0],bold,TEXT);txt(d,(980,y),row[1],font,TEXT);txt(d,(1130,y),row[2],font,TEXT);txt(d,(1260,y),row[3],font,(190,110,0) if row[3]=='Rollover' else (7,143,100))
 im.save(OUT/'admin-dashboard.png')
user();admin()
print('created')
