import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: 'X8959SY8N4.com.petzone.mobileapp',
          paths: ['*'],
        },
      ],
    },
  })
}
