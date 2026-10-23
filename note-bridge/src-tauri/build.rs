use std::{fs, io::Cursor, path::Path};

fn icon_png(size: u32) -> Vec<u8> {
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);
    for y in 0..size {
        for x in 0..size {
            let px = x as f32 / size as f32;
            let py = y as f32 / size as f32;
            let corner_x = (px - 0.5).abs() - 0.31;
            let corner_y = (py - 0.5).abs() - 0.31;
            let inside = corner_x.max(0.0).powi(2) + corner_y.max(0.0).powi(2) <= 0.17_f32.powi(2);
            let stems = (0.25..0.34).contains(&px) || (0.66..0.75).contains(&px);
            let diagonal = (px - (0.29 + (py - 0.26) * 0.86)).abs() < 0.049;
            let mark = (0.25..0.75).contains(&py) && (stems || diagonal);
            rgba.extend_from_slice(if !inside {
                &[0, 0, 0, 0]
            } else if mark {
                &[255, 255, 255, 255]
            } else {
                &[82, 99, 203, 255]
            });
        }
    }
    let mut output = Cursor::new(Vec::new());
    {
        let mut encoder = png::Encoder::new(&mut output, size, size);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder
            .write_header()
            .unwrap()
            .write_image_data(&rgba)
            .unwrap();
    }
    output.into_inner()
}

fn generate_icons() {
    let dir = Path::new("icons");
    fs::create_dir_all(dir).expect("create generated icon directory");
    for (size, name) in [
        (32, "32x32.png"),
        (128, "128x128.png"),
        (256, "128x128@2x.png"),
    ] {
        fs::write(dir.join(name), icon_png(size)).expect("write generated PNG icon");
    }
    let png = icon_png(256);
    let mut ico = vec![0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 32, 0];
    ico.extend_from_slice(&(png.len() as u32).to_le_bytes());
    ico.extend_from_slice(&22_u32.to_le_bytes());
    ico.extend_from_slice(&png);
    fs::write(dir.join("icon.ico"), ico).expect("write generated Windows icon");
    let mut chunks = Vec::new();
    for (size, kind) in [
        (128, b"ic07"),
        (256, b"ic08"),
        (512, b"ic09"),
        (1024, b"ic10"),
    ] {
        let png = icon_png(size);
        chunks.extend_from_slice(kind);
        chunks.extend_from_slice(&(png.len() as u32 + 8).to_be_bytes());
        chunks.extend_from_slice(&png);
    }
    let mut icns = b"icns".to_vec();
    icns.extend_from_slice(&(chunks.len() as u32 + 8).to_be_bytes());
    icns.extend_from_slice(&chunks);
    fs::write(dir.join("icon.icns"), icns).expect("write generated macOS icon");
}

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    generate_icons();
    tauri_build::build();
}
