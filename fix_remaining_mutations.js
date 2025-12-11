const fs = require('fs');

const fixes = [
  {
    file: 'app/customer/bookings/[id]/payment/page.tsx',
    search: '      // Update booking status\n      const { error: updateError } = await supabase\n        .from("bookings")\n        .update({\n          payment_status: "completed",\n          booking_status: "confirmed",\n          payment_method:\n            paymentMethod === "orange" ? "Orange Money" : "MTN Money",\n        } as any)',
    replace: '      // Update booking status\n      const { error: updateError } = (await supabase\n        .from("bookings")\n        .update({\n          payment_status: "completed",\n          booking_status: "confirmed",\n          payment_method:\n            paymentMethod === "orange" ? "Orange Money" : "MTN Money",\n        } as any)) as any'
  },
  {
    file: 'app/customer/onboarding/page.tsx',
    search: '      const { error: updateError } = await supabase\n        .from("profiles")\n        .update({\n          onboarding_completed: true,\n        } as any)',
    replace: '      const { error: updateError } = (await supabase\n        .from("profiles")\n        .update({\n          onboarding_completed: true,\n        } as any)) as any'
  },
  {
    file: 'app/customer/review/[providerId]/page.tsx',
    search: '      const { error: updateError } = await supabase\n        .from("profiles")\n        .update({\n          bio: formData.bio,\n          profile_image_url: formData.profileImage,\n        } as any)',
    replace: '      const { error: updateError } = (await supabase\n        .from("profiles")\n        .update({\n          bio: formData.bio,\n          profile_image_url: formData.profileImage,\n        } as any)) as any'
  },
  {
    file: 'app/customer/service-requests/page.tsx',
    search: '      const { data, error } = await supabase\n        .from("service_requests")\n        .select("*")\n        .eq("customer_id", user?.id)\n        .order("created_at", { ascending: false });',
    replace: '      const { data, error } = (await supabase\n        .from("service_requests")\n        .select("*")\n        .eq("customer_id", user?.id as string)\n        .order("created_at", { ascending: false })) as any;'
  },
  {
    file: 'app/provider/bids/page.tsx',
    search: '  const requestId = params.id',
    replace: '  const requestId = params?.id as string'
  },
  {
    file: 'lib/hooks/use-tier-limits.ts',
    search: '  const id = params.id;',
    replace: '  const id = params?.id as string;'
  }
];

for (const fix of fixes) {
  try {
    if (!fs.existsSync(fix.file)) {
      console.log('⚠ File not found: ' + fix.file);
      continue;
    }
    
    let content = fs.readFileSync(fix.file, 'utf-8');
    if (content.includes(fix.search)) {
      content = content.split(fix.search).join(fix.replace);
      fs.writeFileSync(fix.file, content);
      console.log('✓ Fixed ' + fix.file);
    } else {
      console.log('⚠ Pattern not found in ' + fix.file);
    }
  } catch (e) {
    console.log('✗ Error with ' + fix.file + ': ' + e.message);
  }
}
