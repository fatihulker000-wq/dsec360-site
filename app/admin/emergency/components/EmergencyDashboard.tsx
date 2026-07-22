"use client";

import {
    ClipboardCheck,
    ShieldAlert,
    Users,
    Siren,
    FileWarning,
    CalendarClock,
    UserCheck,
    RefreshCcw,
} from "lucide-react";

const cards = [

    {
        title:"Toplam Plan",
        value:0,
        color:"bg-blue-100",
        icon:ClipboardCheck
    },

    {
        title:"Destek Ekibi",
        value:0,
        color:"bg-green-100",
        icon:Users
    },

    {
        title:"Toplam Üye",
        value:0,
        color:"bg-yellow-100",
        icon:UserCheck
    },

    {
        title:"Yaklaşan Tatbikat",
        value:0,
        color:"bg-red-100",
        icon:Siren
    },

    {
        title:"Revizyon Bekleyen",
        value:0,
        color:"bg-orange-100",
        icon:RefreshCcw
    },

    {
        title:"İmza Bekleyen",
        value:0,
        color:"bg-purple-100",
        icon:FileWarning
    },

    {
        title:"Bu Yıl Tatbikat",
        value:0,
        color:"bg-cyan-100",
        icon:CalendarClock
    },

    {
        title:"Aktif Plan",
        value:0,
        color:"bg-emerald-100",
        icon:ShieldAlert
    }

];

export default function EmergencyDashboard(){

    return(

        <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-5">

            {

                cards.map(card=>{

                    const Icon=card.icon;

                    return(

                        <div
                            key={card.title}
                            className="rounded-2xl border bg-white p-5 shadow-sm"
                        >

                            <div className="flex items-center justify-between">

                                <div>

                                    <div className="text-sm text-slate-500">

                                        {card.title}

                                    </div>

                                    <div className="mt-2 text-3xl font-bold">

                                        {card.value}

                                    </div>

                                </div>

                                <div className={`${card.color} rounded-xl p-3`}>

                                    <Icon size={24}/>

                                </div>

                            </div>

                        </div>

                    );

                })

            }

        </div>

    );

}