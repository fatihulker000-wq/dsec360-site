"use client";

type Props={

    value:string;

    onChange:(v:string)=>void;

};

const tabs=[

    {
        id:"plans",
        label:"Eylem Planları"
    },

    {
        id:"teams",
        label:"Destek Ekipleri"
    },

    {
        id:"drills",
        label:"Tatbikatlar"
    },

    {
        id:"reports",
        label:"Raporlar"
    }

];

export default function EmergencyTabs({

    value,
    onChange

}:Props){

    return(

        <div className="flex gap-3 flex-wrap">

            {

                tabs.map(tab=>(

                    <button

                        key={tab.id}

                        onClick={()=>onChange(tab.id)}

                        className={`rounded-xl px-5 py-3 font-semibold transition

                        ${
                            value===tab.id
                            ?"bg-red-600 text-white"
                            :"bg-white border"
                        }

                        `}

                    >

                        {tab.label}

                    </button>

                ))

            }

        </div>

    );

}